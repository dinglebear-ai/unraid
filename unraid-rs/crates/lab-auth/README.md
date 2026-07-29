# lab-auth

Frozen compatibility release of the OAuth 2.0 and JWT authentication layer used by `unraid-rmcp`.

This source is preserved from commit `87cec3241f9baef22335de9cc8629ebbcd8ba047` of the former Lab repository. It is published as a small standalone dependency so downstream crates can be distributed through crates.io without depending on a Git checkout.

New development belongs in `labby-auth`. This crate exists to preserve the stable API consumed by `unraid-rmcp` while that migration is planned and verified.

## License

MIT.
