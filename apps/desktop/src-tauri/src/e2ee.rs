use aes_gcm::{
    Aes256Gcm, KeyInit,
    aead::{Aead, Payload},
};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::Deserialize;
use std::collections::HashSet;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Envelope {
    pub version: u8,
    pub session_id: String,
    pub device_id: String,
    pub epoch: u64,
    pub counter: u64,
    pub nonce_hex: String,
    pub ciphertext_hex: String,
    pub signature_hex: String,
}

impl Envelope {
    pub fn parse_json(input: &[u8]) -> Result<Self, &'static str> {
        if input.len() > 64 * 1024 {
            return Err("envelope too large");
        }
        let value: Self = serde_json::from_slice(input).map_err(|_| "invalid envelope")?;
        let valid = value.version == 1
            && value.epoch > 0
            && !value.session_id.is_empty()
            && !value.device_id.is_empty()
            && value.nonce_hex.len() == 24
            && value.ciphertext_hex.len() >= 32
            && value.signature_hex.len() == 128
            && [
                &value.nonce_hex,
                &value.ciphertext_hex,
                &value.signature_hex,
            ]
            .iter()
            .all(|item| item.bytes().all(|byte| byte.is_ascii_hexdigit()));
        valid.then_some(value).ok_or("invalid envelope")
    }

    fn signed_bytes(&self) -> Vec<u8> {
        format!(
            "{}|{}|{}|{}|{}|{}",
            self.session_id,
            self.device_id,
            self.epoch,
            self.counter,
            self.nonce_hex,
            self.ciphertext_hex
        )
        .into_bytes()
    }

    pub fn verify_and_decrypt(
        &self,
        key: &[u8; 32],
        public_key: &[u8; 32],
    ) -> Result<String, &'static str> {
        let signature_bytes: [u8; 64] = hex::decode(&self.signature_hex)
            .map_err(|_| "invalid device signature")?
            .try_into()
            .map_err(|_| "invalid device signature")?;
        VerifyingKey::from_bytes(public_key)
            .map_err(|_| "invalid device signature")?
            .verify(
                &self.signed_bytes(),
                &Signature::from_bytes(&signature_bytes),
            )
            .map_err(|_| "invalid device signature")?;
        let nonce = hex::decode(&self.nonce_hex).map_err(|_| "invalid nonce")?;
        let ciphertext = hex::decode(&self.ciphertext_hex).map_err(|_| "invalid ciphertext")?;
        let plaintext = Aes256Gcm::new_from_slice(key)
            .map_err(|_| "invalid key")?
            .decrypt(
                nonce.as_slice().into(),
                Payload {
                    msg: &ciphertext,
                    aad: &[],
                },
            )
            .map_err(|_| "invalid ciphertext or authentication tag")?;
        String::from_utf8(plaintext).map_err(|_| "invalid plaintext")
    }
}

pub struct Receiver {
    epoch: u64,
    devices: HashSet<String>,
    messages: HashSet<(String, u64, u64)>,
    nonces: HashSet<String>,
}

impl Receiver {
    pub fn new(epoch: u64, devices: impl IntoIterator<Item = String>) -> Self {
        Self {
            epoch,
            devices: devices.into_iter().collect(),
            messages: HashSet::new(),
            nonces: HashSet::new(),
        }
    }

    pub fn rotate(
        &mut self,
        epoch: u64,
        devices: impl IntoIterator<Item = String>,
    ) -> Result<(), &'static str> {
        if epoch <= self.epoch {
            return Err("key rollback");
        }
        self.epoch = epoch;
        self.devices = devices.into_iter().collect();
        Ok(())
    }

    pub fn accept(&mut self, envelope: &Envelope) -> Result<(), &'static str> {
        if envelope.epoch != self.epoch {
            return Err("stale epoch");
        }
        if !self.devices.contains(&envelope.device_id) {
            return Err("device impersonation");
        }
        let id = (envelope.device_id.clone(), envelope.epoch, envelope.counter);
        if self.messages.contains(&id) {
            return Err("replay");
        }
        if self.nonces.contains(&envelope.nonce_hex) {
            return Err("nonce reuse");
        }
        self.messages.insert(id);
        self.nonces.insert(envelope.nonce_hex.clone());
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Fixtures {
        key_hex: String,
        session_id: String,
        signing_public_key_hex: String,
        vectors: Vec<Vector>,
    }
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Vector {
        device_id: String,
        epoch: u64,
        counter: u64,
        nonce_hex: String,
        plaintext: String,
        ciphertext_hex: String,
        signature_hex: String,
    }

    fn fixtures() -> Fixtures {
        serde_json::from_str(include_str!(
            "../../../../packages/shared/test-vectors/e2ee-v1.json"
        ))
        .unwrap()
    }
    fn envelopes(f: &Fixtures) -> Vec<Envelope> {
        f.vectors
            .iter()
            .map(|v| Envelope {
                version: 1,
                session_id: f.session_id.clone(),
                device_id: v.device_id.clone(),
                epoch: v.epoch,
                counter: v.counter,
                nonce_hex: v.nonce_hex.clone(),
                ciphertext_hex: v.ciphertext_hex.clone(),
                signature_hex: v.signature_hex.clone(),
            })
            .collect()
    }

    #[test]
    fn shared_vectors_cover_interoperability_and_transitions() {
        let f = fixtures();
        let envelopes = envelopes(&f);
        let key: [u8; 32] = hex::decode(&f.key_hex).unwrap().try_into().unwrap();
        let public: [u8; 32] = hex::decode(&f.signing_public_key_hex)
            .unwrap()
            .try_into()
            .unwrap();
        for (vector, envelope) in f.vectors.iter().zip(&envelopes) {
            assert_eq!(
                envelope.verify_and_decrypt(&key, &public).unwrap(),
                vector.plaintext
            );
        }
        let mut receiver = Receiver::new(1, ["alice-phone".into()]);
        for envelope in &envelopes[0..3] {
            receiver.accept(envelope).unwrap();
        }
        receiver.rotate(2, ["alice-phone".into()]).unwrap();
        receiver.accept(&envelopes[3]).unwrap();
        receiver
            .rotate(3, ["alice-phone".into(), "alice-laptop".into()])
            .unwrap();
        receiver.accept(&envelopes[4]).unwrap();
        receiver.rotate(4, ["alice-phone".into()]).unwrap();
        receiver.accept(&envelopes[5]).unwrap();
    }

    #[test]
    fn rejects_security_regressions() {
        let f = fixtures();
        let mut e = envelopes(&f);
        let mut receiver = Receiver::new(1, ["alice-phone".into()]);
        receiver.accept(&e[0]).unwrap();
        assert_eq!(receiver.accept(&e[0]), Err("replay"));
        e[1].nonce_hex = e[0].nonce_hex.clone();
        assert_eq!(receiver.accept(&e[1]), Err("nonce reuse"));
        assert_eq!(
            receiver.rotate(1, ["alice-phone".into()]),
            Err("key rollback")
        );
        receiver.rotate(2, ["alice-phone".into()]).unwrap();
        assert_eq!(receiver.accept(&e[1]), Err("stale epoch"));
        e[3].device_id = "mallory-device".into();
        assert_eq!(receiver.accept(&e[3]), Err("device impersonation"));
        let key: [u8; 32] = hex::decode(&f.key_hex).unwrap().try_into().unwrap();
        let public: [u8; 32] = hex::decode(&f.signing_public_key_hex)
            .unwrap()
            .try_into()
            .unwrap();
        let mut tampered = envelopes(&f)[0].clone();
        tampered.ciphertext_hex.replace_range(..2, "ff");
        assert!(tampered.verify_and_decrypt(&key, &public).is_err());
        let mut bad_signature = envelopes(&f)[0].clone();
        bad_signature.signature_hex.replace_range(..2, "ff");
        assert_eq!(
            bad_signature.verify_and_decrypt(&key, &public),
            Err("invalid device signature")
        );
    }

    proptest! { #[test] fn envelope_parser_never_panics(bytes in prop::collection::vec(any::<u8>(), 0..70000)) { let _ = Envelope::parse_json(&bytes); } }
}
