# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.0](https://github.com/dinglebear-ai/unraid-mcp/compare/v2.6.0...v2.7.0) (2026-07-24)


### Features

* **plugin:** dedicated Logs tab with Aurora-dark colorized viewer ([#207](https://github.com/dinglebear-ai/unraid-mcp/issues/207)) ([ab3d9a0](https://github.com/dinglebear-ai/unraid-mcp/commit/ab3d9a0e6466723738c86c046fbe4932be8c0658))


### Documentation

* save session log ([#210](https://github.com/dinglebear-ai/unraid-mcp/issues/210)) ([1586d71](https://github.com/dinglebear-ai/unraid-mcp/commit/1586d71232b53e399d138d11f2f982ff837664fe))
* save session log ([#211](https://github.com/dinglebear-ai/unraid-mcp/issues/211)) ([fdcc22a](https://github.com/dinglebear-ai/unraid-mcp/commit/fdcc22afded944ec4a1c85ee6b0a2cf5bb139581))

## [2.6.0](https://github.com/dinglebear-ai/unraid-mcp/compare/v2.5.0...v2.6.0) (2026-07-22)


### Features

* **plugin:** make every UNRAID_* env var configurable from settings ([#206](https://github.com/dinglebear-ai/unraid-mcp/issues/206)) ([2f6489c](https://github.com/dinglebear-ai/unraid-mcp/commit/2f6489c348fee6d75fe01940525511cfe96387b9))
* **plugin:** scaffold native unRAID plugin (.plg + txz + settings UI) ([#201](https://github.com/dinglebear-ai/unraid-mcp/issues/201)) ([685e325](https://github.com/dinglebear-ai/unraid-mcp/commit/685e3250bc7e8df1135cdf316269d80477c43405))
* **plugin:** single-viewport settings page polish ([#204](https://github.com/dinglebear-ai/unraid-mcp/issues/204)) ([9751b32](https://github.com/dinglebear-ai/unraid-mcp/commit/9751b32d12d14b12779affc08e78f60ec83d35f9))


### Bug Fixes

* **ci:** wait for PyPI visibility before MCP Registry publish ([#200](https://github.com/dinglebear-ai/unraid-mcp/issues/200)) ([5580b41](https://github.com/dinglebear-ai/unraid-mcp/commit/5580b41bf89eb48328134c53e695ac467c0a95bb))
* **plugin:** harden install bootstrap after live testing on Unraid 7.3.1 ([#203](https://github.com/dinglebear-ai/unraid-mcp/issues/203)) ([76d501e](https://github.com/dinglebear-ai/unraid-mcp/commit/76d501ea7d9cd52b41638c2c918797966bc0c323))
* **plugin:** Show button reveals stored secrets ([#205](https://github.com/dinglebear-ai/unraid-mcp/issues/205)) ([5a879fb](https://github.com/dinglebear-ai/unraid-mcp/commit/5a879fb12f8339146004756119435e656dd1f103))

## [2.5.0](https://github.com/dinglebear-ai/unraid-mcp/compare/v2.4.1...v2.5.0) (2026-07-22)


### Features

* **auth:** accept static bearer token alongside Google OAuth ([#197](https://github.com/dinglebear-ai/unraid-mcp/issues/197)) ([ac5d9b2](https://github.com/dinglebear-ai/unraid-mcp/commit/ac5d9b24d13d10cb64344d2b142fa93a9f67112c))


### Documentation

* update auth docs for OAuth+bearer coexistence and claude.ai connectors ([#199](https://github.com/dinglebear-ai/unraid-mcp/issues/199)) ([f40b5c5](https://github.com/dinglebear-ai/unraid-mcp/commit/f40b5c5ef0e1089f6208218bbd3a3527279071e3))

## [2.4.1](https://github.com/dinglebear-ai/unraid-mcp/compare/v2.4.0...v2.4.1) (2026-07-21)


### Bug Fixes

* **ci:** repair OpenWiki native bindings; remove Claude workflows ([#196](https://github.com/dinglebear-ai/unraid-mcp/issues/196)) ([e4feeb9](https://github.com/dinglebear-ai/unraid-mcp/commit/e4feeb971d82c4413bfdb0051766c10504efcc4e))
* **ci:** run gitleaks CLI directly instead of gitleaks-action ([#194](https://github.com/dinglebear-ai/unraid-mcp/issues/194)) ([3e7ee59](https://github.com/dinglebear-ai/unraid-mcp/commit/3e7ee5939ab415dd0208525974d7bff6cc89df1e))


### Dependencies

* **deps-dev:** bump hypothesis from 6.156.6 to 6.158.1 ([#193](https://github.com/dinglebear-ai/unraid-mcp/issues/193)) ([52ebbd5](https://github.com/dinglebear-ai/unraid-mcp/commit/52ebbd512f760fd8fdb0a06b9df725176bf1a58f))
* **deps-dev:** bump ty from 0.0.60 to 0.0.61 ([#189](https://github.com/dinglebear-ai/unraid-mcp/issues/189)) ([1126f32](https://github.com/dinglebear-ai/unraid-mcp/commit/1126f32196be189d6f8d1ffbdb28e0e9c25db108))
* **deps:** bump actions/setup-node from 6.4.0 to 7.0.0 ([#184](https://github.com/dinglebear-ai/unraid-mcp/issues/184)) ([c271ebf](https://github.com/dinglebear-ai/unraid-mcp/commit/c271ebffc52ace6825ab7e9b4d527658ce73cd8c))
* **deps:** bump anyio from 4.12.1 to 4.14.2 ([#187](https://github.com/dinglebear-ai/unraid-mcp/issues/187)) ([05f18d6](https://github.com/dinglebear-ai/unraid-mcp/commit/05f18d68ff439acaa155a04374ecc13ff77544d7))
* **deps:** bump github/codeql-action/upload-sarif from 4.37.0 to 4.37.2 ([#185](https://github.com/dinglebear-ai/unraid-mcp/issues/185)) ([1b112d2](https://github.com/dinglebear-ai/unraid-mcp/commit/1b112d2b60c05cf25c13b9096b6284586c8050da))
* **deps:** bump pypa/gh-action-pypi-publish from 1.14.0 to 1.14.1 ([#192](https://github.com/dinglebear-ai/unraid-mcp/issues/192)) ([a83318a](https://github.com/dinglebear-ai/unraid-mcp/commit/a83318af96020fa79433b05c430ff318e81e0419))
* **deps:** bump tailscale/github-action from 4.1.2 to 4.1.3 ([#183](https://github.com/dinglebear-ai/unraid-mcp/issues/183)) ([475a84b](https://github.com/dinglebear-ai/unraid-mcp/commit/475a84b593eacc23530eb2a7a3183071b98d0bbb))
* **deps:** bump websockets from 16.1 to 16.1.1 ([#190](https://github.com/dinglebear-ai/unraid-mcp/issues/190)) ([bfb9b95](https://github.com/dinglebear-ai/unraid-mcp/commit/bfb9b95f986c3b25c164e80dc8f11543b1772bfc))

## [2.4.0](https://github.com/jmagar/unraid-mcp/compare/v2.3.6...v2.4.0) (2026-07-16)


### Features

* plugin TLS config for self-signed certs and fix duplicate hooks manifest entry ([#179](https://github.com/jmagar/unraid-mcp/issues/179)) ([a0bf9ae](https://github.com/jmagar/unraid-mcp/commit/a0bf9aef1b57e7914a7db9d899457ff4dc7e12d9))


### Bug Fixes

* make release reconciliation resumable ([#180](https://github.com/jmagar/unraid-mcp/issues/180)) ([4b10711](https://github.com/jmagar/unraid-mcp/commit/4b10711757689f4e4680af75f13a9bb6d949c048))


### Dependencies

* **deps-dev:** bump hypothesis from 6.156.4 to 6.156.6 ([#169](https://github.com/jmagar/unraid-mcp/issues/169)) ([db641b1](https://github.com/jmagar/unraid-mcp/commit/db641b176d54714631c186deef37cbc58fa4995b))
* **deps-dev:** bump ruff from 0.15.20 to 0.15.22 ([#170](https://github.com/jmagar/unraid-mcp/issues/170)) ([22ce13c](https://github.com/jmagar/unraid-mcp/commit/22ce13cc30d05c6f0900c456155e8cda372079da))
* **deps-dev:** bump ty from 0.0.57 to 0.0.60 ([#167](https://github.com/jmagar/unraid-mcp/issues/167)) ([407e518](https://github.com/jmagar/unraid-mcp/commit/407e5180885ec12b4d9e5bd2c9b6df4e3d19e501))
* **deps:** bump docker/build-push-action from 7.2.0 to 7.3.0 ([#165](https://github.com/jmagar/unraid-mcp/issues/165)) ([5e5d8b3](https://github.com/jmagar/unraid-mcp/commit/5e5d8b38f00cb916b6da012ab93d466a861e5f58))
* **deps:** bump github/codeql-action/upload-sarif from 4.36.3 to 4.37.0 ([#166](https://github.com/jmagar/unraid-mcp/issues/166)) ([0ad3b55](https://github.com/jmagar/unraid-mcp/commit/0ad3b554786800a5df5c495a1e9d3f60a28fff72))
* **deps:** bump websockets from 16.0 to 16.1 ([#168](https://github.com/jmagar/unraid-mcp/issues/168)) ([9a235db](https://github.com/jmagar/unraid-mcp/commit/9a235dbd9f4d32495bc92ee5ee2afb06868a9772))


### Documentation

* save session log ([#181](https://github.com/jmagar/unraid-mcp/issues/181)) ([45f9f62](https://github.com/jmagar/unraid-mcp/commit/45f9f62c0d9fddd833bc1083d62a9790ad1c7062))
* update OpenWiki ([#171](https://github.com/jmagar/unraid-mcp/issues/171)) ([909017f](https://github.com/jmagar/unraid-mcp/commit/909017feb598c846eaca150249b696b77cb67055))

## [2.3.6](https://github.com/jmagar/unraid-mcp/compare/v2.3.5...v2.3.6) (2026-07-16)


### Bug Fixes

* harden project after comprehensive review ([#174](https://github.com/jmagar/unraid-mcp/issues/174)) ([09cfd96](https://github.com/jmagar/unraid-mcp/commit/09cfd96003fed4de2047164b7eaf525318ccac48))


### Documentation

* save session log ([#177](https://github.com/jmagar/unraid-mcp/issues/177)) ([018bcb4](https://github.com/jmagar/unraid-mcp/commit/018bcb4cd0bfb552126dd980999129d4d70d10ee))

## [2.3.5](https://github.com/jmagar/unraid-mcp/compare/v2.3.4...v2.3.5) (2026-07-11)


### Bug Fixes

* delegate google oauth consent to provider ([efa864a](https://github.com/jmagar/unraid-mcp/commit/efa864ad1e897e229025cacb74a517aa38cfb183))

## [2.3.4](https://github.com/jmagar/unraid-mcp/compare/v2.3.3...v2.3.4) (2026-07-09)


### Dependencies

* **deps-dev:** bump build from 1.5.0 to 1.5.1 ([#160](https://github.com/jmagar/unraid-mcp/issues/160)) ([d39ddd5](https://github.com/jmagar/unraid-mcp/commit/d39ddd5f6084176655a3476de6acb7842c1c4d97))
* **deps-dev:** bump hypothesis from 6.156.1 to 6.156.4 ([#161](https://github.com/jmagar/unraid-mcp/issues/161)) ([7dd5d6a](https://github.com/jmagar/unraid-mcp/commit/7dd5d6a4462f1e0c4bf6aec9859b2910af0c7ced))
* **deps-dev:** bump ty from 0.0.56 to 0.0.57 ([#162](https://github.com/jmagar/unraid-mcp/issues/162)) ([78b265a](https://github.com/jmagar/unraid-mcp/commit/78b265aa1cfbd0f8d567749f597fe0cee8c39534))
* **deps:** bump actions/checkout from 4 to 7 ([#155](https://github.com/jmagar/unraid-mcp/issues/155)) ([fc51265](https://github.com/jmagar/unraid-mcp/commit/fc51265b55c51befdacf42c3216c84bb89fcca97))
* **deps:** bump actions/setup-node from 4 to 6 ([#157](https://github.com/jmagar/unraid-mcp/issues/157)) ([d288e6c](https://github.com/jmagar/unraid-mcp/commit/d288e6c6e47c0f3acb591145e6355006f43031f9))
* **deps:** bump astral-sh/setup-uv from 8.2.0 to 8.3.2 ([#158](https://github.com/jmagar/unraid-mcp/issues/158)) ([29b575e](https://github.com/jmagar/unraid-mcp/commit/29b575e5a0e1064154e233b1d88a9e6ead3a5765))
* **deps:** bump docker/setup-buildx-action from 4.1.0 to 4.2.0 ([#156](https://github.com/jmagar/unraid-mcp/issues/156)) ([ae5cce1](https://github.com/jmagar/unraid-mcp/commit/ae5cce1b18e4e6376365fd10cabd6fa9747ef591))
* **deps:** bump fastmcp from 3.4.2 to 3.4.4 ([#159](https://github.com/jmagar/unraid-mcp/issues/159)) ([3ecaee2](https://github.com/jmagar/unraid-mcp/commit/3ecaee2b9752f9149ad60a9ac8544dc0c9c31581))
* **deps:** bump peter-evans/create-pull-request from 7 to 8 ([#154](https://github.com/jmagar/unraid-mcp/issues/154)) ([d91a639](https://github.com/jmagar/unraid-mcp/commit/d91a63926026fc6d648f1db013a46b99beda3fff))

## [2.3.3](https://github.com/jmagar/unraid-mcp/compare/v2.3.2...v2.3.3) (2026-07-09)


### Bug Fixes

* **ci:** switch OpenWiki to local openai-compatible proxy ([9ce93a6](https://github.com/jmagar/unraid-mcp/commit/9ce93a62ff675f3e3d3ad4238e586db487bdd699))


### Documentation

* update OpenWiki ([297319c](https://github.com/jmagar/unraid-mcp/commit/297319c8f3410c05234a923698d16059f49474e2))
* update OpenWiki ([adf9a5f](https://github.com/jmagar/unraid-mcp/commit/adf9a5f3f483752a479ddca4b6dfc609c93fbdc5))

## [2.3.2](https://github.com/jmagar/unraid-mcp/compare/v2.3.1...v2.3.2) (2026-07-02)


### Bug Fixes

* adapt to Unraid NetworkMetrics schema drift ([75bff2f](https://github.com/jmagar/unraid-mcp/commit/75bff2f6626ef9d59eedc246b740757ce775c34b))
* adapt to Unraid NetworkMetrics schema drift ([519ceb5](https://github.com/jmagar/unraid-mcp/commit/519ceb55722c6dd1ae9843f03726840d559ef8a1)), closes [#138](https://github.com/jmagar/unraid-mcp/issues/138)
* cap live/network_metrics interface list and refresh stale docs ([059d0b0](https://github.com/jmagar/unraid-mcp/commit/059d0b0588fb109002d21333958e0e73a7ef7c0e))
* close a test-isolation leak in the new SSL precedence fixture ([30c0468](https://github.com/jmagar/unraid-mcp/commit/30c046870aeee0b5c188245d391ac57d27630324))
* stop Dockerfile from shadowing container-local .env config ([a1be398](https://github.com/jmagar/unraid-mcp/commit/a1be3982f6952ffd86cde43319e0d00d6dab5e18))
* stop plugin manifests from shadowing .env config ([432ccf6](https://github.com/jmagar/unraid-mcp/commit/432ccf648fe29d0d154661a75dc8bcee17e0e5f0))
* stop plugin manifests from shadowing .env config ([#137](https://github.com/jmagar/unraid-mcp/issues/137)) ([81ec6b4](https://github.com/jmagar/unraid-mcp/commit/81ec6b48f1d413ae297f73af37bf4c3e6dd849af))

## [2.3.1](https://github.com/jmagar/unraid-mcp/compare/v2.3.0...v2.3.1) (2026-06-29)


### Documentation

* refresh env and marketplace references ([930aeae](https://github.com/jmagar/unraid-mcp/commit/930aeaecc1af52c2f8efda3a6e8f3c18957f62f5))
* refresh env and marketplace references ([8188faf](https://github.com/jmagar/unraid-mcp/commit/8188fafdd501f3b8450242064c9be6e557f9620e))

## [2.3.0](https://github.com/jmagar/unraid-mcp/compare/v2.2.0...v2.3.0) (2026-06-29)


### Features

* add optional Google OAuth authentication for HTTP transport ([a855192](https://github.com/jmagar/unraid-mcp/commit/a855192260aab976d4b67b8ecb8fd3c518cec4aa))
* add optional Google OAuth authentication for HTTP transport ([75eda35](https://github.com/jmagar/unraid-mcp/commit/75eda353c536d813389c3c6c7adab68b108b23a0))
* dispatch Claude for schema drift ([c0d9f01](https://github.com/jmagar/unraid-mcp/commit/c0d9f017b2e875b7a2f0c025f52adf568a86343a))
* summarize schema drift issues ([2a9f492](https://github.com/jmagar/unraid-mcp/commit/2a9f492ee9ff8289de908dfbd6fff4551110f33b))
* support Unraid GraphQL schema drift (SDL hash ae82121) ([a6761d4](https://github.com/jmagar/unraid-mcp/commit/a6761d45fff13109709bfc6817f47c931fdf349d))
* support Unraid GraphQL schema drift (SDL hash ae82121) ([a353e39](https://github.com/jmagar/unraid-mcp/commit/a353e3998847a34bae2b6bf1aa667e82d313b0bf)), closes [#107](https://github.com/jmagar/unraid-mcp/issues/107)


### Bug Fixes

* address schema drift review findings ([de7894c](https://github.com/jmagar/unraid-mcp/commit/de7894caae67dc778e09be011a9a87451932f969))
* address schema drift review findings ([fdf4a1e](https://github.com/jmagar/unraid-mcp/commit/fdf4a1ebef3d4b3c80b2299fc1ab12dc2c90f5b4))
* address schema drift review issues ([9a98efe](https://github.com/jmagar/unraid-mcp/commit/9a98efe511a94b71ad6be6941c0cbeb086e92cb1))
* allow Claude review on bot PRs ([8aa9fd8](https://github.com/jmagar/unraid-mcp/commit/8aa9fd80395d9a28e8dceb528a0561ee690726cc))
* allow dispatched Claude drift debug runs ([0300283](https://github.com/jmagar/unraid-mcp/commit/0300283321f02481f563190a045599a0ce368d00))
* allow longer Claude drift runs ([43b9b8c](https://github.com/jmagar/unraid-mcp/commit/43b9b8cdf9edaccbf3f330d7543e91deb0ead6c8))
* bound Claude drift workflow steps ([e0e6d03](https://github.com/jmagar/unraid-mcp/commit/e0e6d039363c26de709beff07d8cd7b526e25bbe))
* expose Claude drift action failures ([1a82dbc](https://github.com/jmagar/unraid-mcp/commit/1a82dbc6dfe430d1f0f9c8b296b20151daf814f8))
* harden google oauth review issues ([b656648](https://github.com/jmagar/unraid-mcp/commit/b6566485aa11d2c9eab2e8d4199cdf067fa1990b))
* harden schema drift automation ([a20c3df](https://github.com/jmagar/unraid-mcp/commit/a20c3df4dd960845e53752ce669f2e7610610714))
* keep Claude extra permissions valid ([8028e3e](https://github.com/jmagar/unraid-mcp/commit/8028e3e3eb6529b7c32c0f0de155e1ddecc12346))
* keep drift CI waiting in workflow ([346d6b4](https://github.com/jmagar/unraid-mcp/commit/346d6b4360aac099ca07d4755847d36be1739122))
* let Claude repair failing drift CI ([11f332a](https://github.com/jmagar/unraid-mcp/commit/11f332a29ee9a429aadca0bdf51fb3fcbac27902))
* prepare Claude drift runner tooling ([c2fe9a2](https://github.com/jmagar/unraid-mcp/commit/c2fe9a272f7d5d5dbe929fb34a2f56c2e606d394))
* prepare observable Claude drift PR ([ff55209](https://github.com/jmagar/unraid-mcp/commit/ff55209f70da829917e68508f7fa59928a44a4ee))
* preserve schema drift issue label ([18cf12a](https://github.com/jmagar/unraid-mcp/commit/18cf12a6cc3712ff13602ba679df784e0ba53926))
* preserve schema drift issue label ([16d6d3b](https://github.com/jmagar/unraid-mcp/commit/16d6d3be3ab793553b8c9c248005de1b5dd9fbcd))
* raise Claude drift implementation budget ([fed4c12](https://github.com/jmagar/unraid-mcp/commit/fed4c126d82fc99c3f2c27ccab67999aca85f97e))
* raise Claude drift turn budget ([13f417c](https://github.com/jmagar/unraid-mcp/commit/13f417c9a8a403efc91ee4f72226a867792b3a17))
* remove Claude drift turn cap ([ffd2651](https://github.com/jmagar/unraid-mcp/commit/ffd265183884f6b859028a160092e9fb79b9eb0e))
* require Claude drift local gates ([3a6b8dd](https://github.com/jmagar/unraid-mcp/commit/3a6b8dd5eb8037766c060fa617f123d862927158))
* require Claude schema drift PR output ([1f47522](https://github.com/jmagar/unraid-mcp/commit/1f47522f226a38ed8c7ed3e678566750248450d1))
* require green CI for Claude drift PRs ([2d3d136](https://github.com/jmagar/unraid-mcp/commit/2d3d13605609d6761bfbcbf91fa5614c1a24001b))
* seed Claude drift PR branch ([87191d6](https://github.com/jmagar/unraid-mcp/commit/87191d65c894c132b97ea01794934f23454ea3d8))
* verify Claude drift PR with workflow token ([a1786ab](https://github.com/jmagar/unraid-mcp/commit/a1786abadb51971ef4bdd757e6d1711f6a926aff))


### Documentation

* add blank line after new CLAUDE.md heading (MD022) ([a1d0833](https://github.com/jmagar/unraid-mcp/commit/a1d0833f7616f020661765f7813a58c54c4a4fd6))
* refresh Unraid schema artifacts ([5031244](https://github.com/jmagar/unraid-mcp/commit/5031244da274c5a09fe0d89ebde5a1996a80b85d))
* save Claude schema drift automation session ([11f9eec](https://github.com/jmagar/unraid-mcp/commit/11f9eec8d05a4d03728bd14ab827abc1e06168b4))
* save session log ([b527e5d](https://github.com/jmagar/unraid-mcp/commit/b527e5d565617902f2e42b715d9c83b30168dd48))

## [2.2.0](https://github.com/jmagar/unraid-mcp/compare/v2.1.2...v2.2.0) (2026-06-23)


### Features

* add safe direct Unraid query root reads ([7a40f4a](https://github.com/jmagar/unraid-mcp/commit/7a40f4ac2f448eb5812dc8539c0d6b595fcf64dc))
* expose safe direct Unraid query-root reads ([fe43dc3](https://github.com/jmagar/unraid-mcp/commit/fe43dc3c30eeda9b2a2ad9d57f057360369d0d25))


### Bug Fixes

* address pr review findings ([93c4b5e](https://github.com/jmagar/unraid-mcp/commit/93c4b5e9a960ed7cf7df993753cbf52d221556bd))
* address safe query root review findings ([72699f8](https://github.com/jmagar/unraid-mcp/commit/72699f82d41f1ab5e232d8a0659444dd684b274a))


### Documentation

* correct stale hook/script references across docs tree ([5b7e879](https://github.com/jmagar/unraid-mcp/commit/5b7e8791320b902a4af94e79d8f5502dcb0d919e))
* document safe query root reads ([7caac0f](https://github.com/jmagar/unraid-mcp/commit/7caac0f27f556a59512c91f3c8a5d50d78ac9ad0))
* fix plugin readme markdown spacing ([8b7cab1](https://github.com/jmagar/unraid-mcp/commit/8b7cab1409c545cb8eb325c406f0d9fcafd2113b))
* save session log ([c69ce3d](https://github.com/jmagar/unraid-mcp/commit/c69ce3d01515a35c8a67d3376dc378c1a4444d37))
* save session log ([0774a20](https://github.com/jmagar/unraid-mcp/commit/0774a20e14a2794aed75371cdbc9da35c27c1111))

## [2.1.2](https://github.com/jmagar/unraid-mcp/compare/v2.1.1...v2.1.2) (2026-06-23)


### Bug Fixes

* code-review remediation — 44 fixes, hardening, and tests ([#88](https://github.com/jmagar/unraid-mcp/issues/88)) ([80f4b02](https://github.com/jmagar/unraid-mcp/commit/80f4b02e031409537fe841c7546c6f26bcacce30))
* pin Docker runtime to Python 3.12 ([2f6033a](https://github.com/jmagar/unraid-mcp/commit/2f6033a148cfa45a2c55f5847b40d545dc8c662f)), closes [#89](https://github.com/jmagar/unraid-mcp/issues/89)

## [2.1.1](https://github.com/jmagar/unraid-mcp/compare/v2.1.0...v2.1.1) (2026-06-22)


### Bug Fixes

* **docker:** pin uv builder to python3.12-bookworm-slim tag ([#86](https://github.com/jmagar/unraid-mcp/issues/86)) ([d0cad00](https://github.com/jmagar/unraid-mcp/commit/d0cad00d2f060868f836fdb7b711292252a6019f))

## [2.1.0](https://github.com/jmagar/unraid-mcp/compare/v2.0.1...v2.1.0) (2026-06-21)


### ⚠ BREAKING CHANGES

* **core:** deployments running UNRAID_VERIFY_SSL=false must now also set UNRAID_ALLOW_INSECURE_TLS=true, and deployments running UNRAID_MCP_DISABLE_HTTP_AUTH=true on a non-loopback host must now also set UNRAID_MCP_TRUST_PROXY=true, or the server refuses to start.

### Features

* **core:** remove unused query cache; gate insecure TLS and unauthenticated public bind ([9d6bc15](https://github.com/jmagar/unraid-mcp/commit/9d6bc15f2501ba4e909026bd4d85560d2d9ac506))


### Bug Fixes

* **cache:** correct dead query-cache prefix and replace tautological test ([679a14e](https://github.com/jmagar/unraid-mcp/commit/679a14e92d7d2c64728d4f8e749e8529756c2410))
* **core:** classify bug-vs-upstream errors, fix pagination default, scan secret values ([eca1a69](https://github.com/jmagar/unraid-mcp/commit/eca1a69312c5765dbdca41b79d8d6a5e9fb481db))
* **core:** isolate idempotency patterns, sanitize Host reflection, faster size check, annotate log handler ([284b668](https://github.com/jmagar/unraid-mcp/commit/284b6689366a9cf554cd62ae23380c58b0b4072d))
* **docker:** guard unhandled subaction to prevent masked KeyError ([4d0d22a](https://github.com/jmagar/unraid-mcp/commit/4d0d22a0802162f8cbafb3dcd70f1b0c2fdbf39e))
* repair drifted Justfile recipes (check-contract + typecheck) ([f0f7e23](https://github.com/jmagar/unraid-mcp/commit/f0f7e23ce0eb024ce420d07bdf3a40630400a52e))
* repair drifted Justfile recipes (check-contract + typecheck) ([9c9d43a](https://github.com/jmagar/unraid-mcp/commit/9c9d43a31150b9ae48800d4f74c8867ce752d440))
* **security:** add SSRF guard to plugin install and bound notification/list size ([375db66](https://github.com/jmagar/unraid-mcp/commit/375db662f52a01314dd141b0a62f2391f5050cb2))
* **server:** refuse unauthenticated HTTP endpoint on non-loopback bind (S-H3) ([84c86c4](https://github.com/jmagar/unraid-mcp/commit/84c86c403b306785ac530d740cb9e4399b6f359f))
* **server:** refuse unauthenticated HTTP endpoint on non-loopback bind (S-H3) ([e87afe1](https://github.com/jmagar/unraid-mcp/commit/e87afe11f5e89ac8ea70a7f042348c913385c383))
* **server:** run shutdown cleanup via FastMCP lifespan ([3571da6](https://github.com/jmagar/unraid-mcp/commit/3571da6d6f09f83104dc0fb39e688f3cdbbcb1e5))
* **subscriptions:** resilient snapshot frame parsing + coverage for malformed frames, concurrency, diagnostics ([25d9393](https://github.com/jmagar/unraid-mcp/commit/25d93937dfc08252cc92b1b7f11e66d0a5199509))
* **subscriptions:** restore best-effort subscribe_collect; harden protocol; correct lock docstrings ([9d38b93](https://github.com/jmagar/unraid-mcp/commit/9d38b93ce4685d1c4b4d187283df5b394bfa7101))
* **tools:** drop machineId from health summary; tidy naming; note parity-history bound ([daf825a](https://github.com/jmagar/unraid-mcp/commit/daf825a4c8dae3a056d84690311371022bc6ff8c))
* **tools:** None-safe container name matching and consolidated /boot path boundary ([6a565de](https://github.com/jmagar/unraid-mcp/commit/6a565de0f4fe2397f289ceac01258c9c7b13eae8))
* **tools:** project mutation responses to the result subtree, not raw GraphQL data ([ed0184a](https://github.com/jmagar/unraid-mcp/commit/ed0184a6ee0a650ecb301cce5e9027ae1b8b00c9))


### Performance Improvements

* **subscriptions:** serve live/* snapshots from warm persistent cache ([bb5f36f](https://github.com/jmagar/unraid-mcp/commit/bb5f36f17de381fa8cf434f18754c5f8195fdff6))


### Documentation

* correct action/subaction tables and drop pre-2.0.0 tool surface ([9b7a60c](https://github.com/jmagar/unraid-mcp/commit/9b7a60ce2df623445800342c128c4e8602a0bca4))
* correct subscription allowlist, env-var coverage, and DEBUG-logging caveat ([078e9ca](https://github.com/jmagar/unraid-mcp/commit/078e9ca5fc99e468894826e8a70ecad24de413b3))
* fix destructive/cache/rate-limit/response-size docs and patch-target guidance ([5623f05](https://github.com/jmagar/unraid-mcp/commit/5623f059bfc8013fd0f45f9f2e7b5a144d37c212))
* save session log ([f47740c](https://github.com/jmagar/unraid-mcp/commit/f47740ce43e3e94969947e12f8b983d2d82d215c))
* save session log (Justfile recipe drift fix) ([7c4444b](https://github.com/jmagar/unraid-mcp/commit/7c4444b1352a25ec2204581c0a6eefe8a133b090))


### Miscellaneous Chores

* release as 2.1.0 ([010f683](https://github.com/jmagar/unraid-mcp/commit/010f683905537135377f92eee3c6b971b48c6b05))

## [2.0.1](https://github.com/jmagar/unraid-mcp/compare/v2.0.0...v2.0.1) (2026-06-20)


### Documentation

* save session log ([eab867c](https://github.com/jmagar/unraid-mcp/commit/eab867c9327e266f12593ba10ab9e8a46a81f3c1))

## [2.0.0](https://github.com/jmagar/unraid-mcp/compare/v1.6.1...v2.0.0) (2026-06-20)


### ⚠ BREAKING CHANGES

* the `unraid_help`, `diagnose_subscriptions`, and `test_subscription_query` MCP tools are removed; use the `unraid` tool's `help` and `subscriptions` actions instead. Installed plugins now require `uv`/`uvx` on PATH and run the published `unraid-mcp` PyPI package.

### Features

* restructure into plugins/unraid marketplace + consolidate diagnostic tools ([#65](https://github.com/jmagar/unraid-mcp/issues/65)) ([176e80c](https://github.com/jmagar/unraid-mcp/commit/176e80c504065b206f815bb0167101f2b9e502f3))


### Documentation

* save session log ([#62](https://github.com/jmagar/unraid-mcp/issues/62)) ([05247c1](https://github.com/jmagar/unraid-mcp/commit/05247c1fc5b522ca3f89da60c3bfbd439a78e422))

## [1.6.1](https://github.com/jmagar/unraid-mcp/compare/v1.6.0...v1.6.1) (2026-06-19)


### Bug Fixes

* **ci:** sync uv.lock self-version to 1.6.0 ([#58](https://github.com/jmagar/unraid-mcp/issues/58)) ([6e262f2](https://github.com/jmagar/unraid-mcp/commit/6e262f2cff7d0506a61268cd49e07d69a0ec6371))


### Documentation

* add 2026-06-19 session log (issue/PR triage + output audit) ([#56](https://github.com/jmagar/unraid-mcp/issues/56)) ([cfc390c](https://github.com/jmagar/unraid-mcp/commit/cfc390cda29306d9040cdb4b4a4c4924a447b9a4))

## [1.6.0](https://github.com/jmagar/unraid-mcp/compare/v1.5.0...v1.6.0) (2026-06-19)


### Features

* replace credential elicitation with plugin userConfig + .env setup hook ([#47](https://github.com/jmagar/unraid-mcp/issues/47)) ([c6721c1](https://github.com/jmagar/unraid-mcp/commit/c6721c1d4c44216eaeeba2e242194f6536f0cf04))
* severity + context filtering for live log subactions ([#26](https://github.com/jmagar/unraid-mcp/issues/26)) ([#46](https://github.com/jmagar/unraid-mcp/issues/46)) ([b97284c](https://github.com/jmagar/unraid-mcp/commit/b97284ca8b82231ef42294f4c4501fe11656e0a0))


### Bug Fixes

* **deps:** upgrade 6 packages to resolve all Dependabot security alerts ([#41](https://github.com/jmagar/unraid-mcp/issues/41)) ([5a74a1a](https://github.com/jmagar/unraid-mcp/commit/5a74a1a6965996bfc91754cd4754017a26d0d85d))
* lower response-size backstop to 40KB (~10K tokens) ([#55](https://github.com/jmagar/unraid-mcp/issues/55)) ([176f9d7](https://github.com/jmagar/unraid-mcp/commit/176f9d77af5fea03e8a4e26de965866aae78e723))
* matchedLines counts only severity matches; add returnedLines ([#48](https://github.com/jmagar/unraid-mcp/issues/48)) ([#49](https://github.com/jmagar/unraid-mcp/issues/49)) ([71cec32](https://github.com/jmagar/unraid-mcp/commit/71cec3231a9f4c03fba39e75ccf90f3c00c0b4a2))
* structured response-size limit at 128KB with truncation marker ([#51](https://github.com/jmagar/unraid-mcp/issues/51)) ([f2c788c](https://github.com/jmagar/unraid-mcp/commit/f2c788c9a4d3e37c20209f084004845a5811fe1a))
* tolerate null Share.id for auto-created shares ([#29](https://github.com/jmagar/unraid-mcp/issues/29)) ([#43](https://github.com/jmagar/unraid-mcp/issues/43)) ([f3bdcd4](https://github.com/jmagar/unraid-mcp/commit/f3bdcd4431c3fd7ce78842755a68bb0c85721fb2))
* treat empty credential env vars as unset so ~/.unraid-mcp/.env loads ([#28](https://github.com/jmagar/unraid-mcp/issues/28)) ([#44](https://github.com/jmagar/unraid-mcp/issues/44)) ([e19c981](https://github.com/jmagar/unraid-mcp/commit/e19c981ec43d33ceb52cd2973d209acb810c8a52))


### Performance Improvements

* cap docker/disk/array/live lists; fetch single docker container ([#53](https://github.com/jmagar/unraid-mcp/issues/53)) ([d6cd7d3](https://github.com/jmagar/unraid-mcp/commit/d6cd7d338896600bc7e0c53059c8b37ed1ffb421))
* scope rclone/config_form, trim oidc/rclone fields, cap key/plugin lists, clamp notification limit ([#54](https://github.com/jmagar/unraid-mcp/issues/54)) ([f80a41b](https://github.com/jmagar/unraid-mcp/commit/f80a41bf71cf38e01d44295614da062f9ee3336f))
* trim system/array,overview echoes and cap timezones ([#52](https://github.com/jmagar/unraid-mcp/issues/52)) ([10cef5f](https://github.com/jmagar/unraid-mcp/commit/10cef5ffcacd916992a2cfe772f7d31566dc4834))


### Documentation

* document Claude Desktop mcp-remote proxy config ([#2](https://github.com/jmagar/unraid-mcp/issues/2)) ([#45](https://github.com/jmagar/unraid-mcp/issues/45)) ([71d3c16](https://github.com/jmagar/unraid-mcp/commit/71d3c16ace1b1b1baaaa7e8819ef101cad3f6601))

## [1.5.0](https://github.com/jmagar/unraid-mcp/compare/v1.4.1...v1.5.0) (2026-06-19)


### Features

* render API docs with graphql-markdown + GraphQL Inspector ([#34](https://github.com/jmagar/unraid-mcp/issues/34)) ([b88cdbb](https://github.com/jmagar/unraid-mcp/commit/b88cdbb5dd1de3fb85a85f5d84027640783249e9))


### Bug Fixes

* handle HEAD /health in HealthMiddleware for Docker healthcheck ([#32](https://github.com/jmagar/unraid-mcp/issues/32)) ([b062e31](https://github.com/jmagar/unraid-mcp/commit/b062e31e08738c40c691ef5b43c264f82a1bf75d)), closes [#31](https://github.com/jmagar/unraid-mcp/issues/31)

## [Unreleased]

### Fixed
- **`HealthMiddleware`**: now handles `HEAD /health` in addition to `GET /health`
  without bearer auth. Docker's image healthcheck uses `wget --spider`, which
  sends a `HEAD` request that previously fell through to bearer auth and returned
  `401 Unauthorized`, marking the container `unhealthy` whenever
  `UNRAID_MCP_BEARER_TOKEN` was configured. HEAD returns the same status/headers
  as GET with an empty body per RFC 9110. (#31)

### Changed
- **`bin/generate_unraid_api_reference.py`**: replaced the hand-rolled Markdown
  and schema-diff builders with official GraphQL tooling, invoked via `npx` on
  demand (no committed JS dependencies):
  - `UNRAID-API-COMPLETE-REFERENCE.md` is now rendered by
    [graphql-markdown](https://github.com/exogen/graphql-markdown).
  - `UNRAID-API-CHANGES.md` is now produced by
    [GraphQL Inspector](https://the-guild.dev/graphql/inspector) `diff`.
  - The condensed `UNRAID-API-SUMMARY.md` remains a curated, project-specific
    table (no off-the-shelf tool produces that shape).
  - Introspection is still fetched from a live API by default; a new
    `--from-introspection PATH` flag regenerates the docs offline from a saved
    payload (used by tests and for reproducible regeneration).
  - Requires Node.js 18+ (`npx`) when rendering the reference/diff.
- Regenerated the canonical `docs/unraid/` artifacts with the new pipeline.

## [1.5.1] - 2026-06-19

### Changed

- **Upgraded FastMCP `3.2.0` → `3.4.2`** (latest). Picks up the v3.3.x/v3.4.x
  line: hardened OAuth Proxy silent-consent flow, OTEL semantic-convention
  coverage for all list operations, `ToolResult` structured errors, proactive
  OAuth token refresh, and JWT compatibility fixes (joserfc migration, Clerk
  `cat` header support). Transitive bumps include **Starlette `0.52.1` → `1.3.1`**
  (enforced floor for CVE-2026-48710), `authlib 1.6.9 → 1.7.2`, and
  `python-multipart 0.0.22 → 0.0.32`. No code changes required — the project's
  ASGI auth middleware references Starlette only under `TYPE_CHECKING`, and the
  full test suite passes against the new stack.

## [1.5.0] - 2026-06-19

### Added

- **Claude Code plugin `userConfig` is now actually wired to the server.** `.mcp.json` maps the `unraid_api_url` / `unraid_api_key` plugin options into the stdio server's environment via `${CLAUDE_PLUGIN_OPTION_UNRAID_API_URL}` / `${CLAUDE_PLUGIN_OPTION_UNRAID_API_KEY}` (previously these env vars were hardcoded to empty strings, so the configured values never reached the server). The reliable `$CLAUDE_PLUGIN_OPTION_*` env-var form is used rather than the `${user_config.*}` placeholder, which silently breaks MCP server spawn (claude-code #51573).

### Removed

- **HTTP-transport `userConfig` fields** (`unraid_mcp_url`, `unraid_mcp_token`) from `.claude-plugin/plugin.json`. The bundled plugin runs the server over stdio, so the remote MCP URL and bearer-token options were vestigial and never consumed.

## [1.4.2] - 2026-06-19

### Fixed

- **Test suite was fully broken on `main`.** `tests/test_generate_unraid_api_reference.py` imported from `scripts.` after the `scripts/` → `bin/` rename, causing a collection error that aborted the entire `pytest` run (so the `Test` CI job had been red and masking everything). Repointed the import to `bin.` and added `pythonpath = ["."]` to the pytest config so the top-level `bin` namespace package resolves.
- Removed three obsolete tests in `tests/test_review_regressions.py` (`test_sync_env_rejects_multiline_values`, `test_sync_env_rejects_empty_bearer_token`, `test_ensure_gitignore_preserves_ignore_before_negation`) that invoked `hooks/scripts/sync-env.sh` and `ensure-gitignore.sh` — hook scripts that were intentionally deleted, so the tests failed with exit code 127.

### Changed

- **CI hardening** across `ci.yml`, `docker-publish.yml`, and `publish-pypi.yml`:
  - Added least-privilege top-level `permissions: contents: read` to every workflow; jobs elevate only what they need.
  - Added `concurrency` groups to cancel superseded runs (release publish uses `cancel-in-progress: false`).
  - Pinned all GitHub Actions to commit SHAs (previously floating tags in `ci.yml`/`publish-pypi.yml`), matching the convention already used in `docker-publish.yml`.
  - Added `timeout-minutes` to every job.
  - CI now installs with `uv sync --locked` so a drifted `uv.lock` fails fast instead of being silently updated.
  - The Trivy image scan now uploads its SARIF results to the GitHub Security tab (previously the report was generated and discarded); added `security-events: write` and `ignore-unfixed: true`.
  - The `Version Sync Check` job now calls `bin/check-version-sync.sh` instead of duplicating the logic inline.

## [1.4.1] - 2026-06-19

### Fixed

- **`unraid` tool docstring subaction counts** now match the documented (user-facing) convention used across `CLAUDE.md`, `README.md`, and `docs/`: `docker` 7 → 8 (the `ports` subaction added in 1.4.0 was missed in the module docstring), `system` 20 → 18, `notification` 13 → 12, `key` 8 → 7. The higher numbers counted deprecated/internal subactions (`logs`, `server_time`, `timezones`, `notify_if_unique`, `possible_roles`) that the rest of the docs intentionally exclude, the same way `docker` already omits the deprecated `logs` subaction.

## [1.4.0] - 2026-04-28

### Added

- **`docker/ports`**: New aggregator subaction returning all host port bindings across running containers in a single call. Sorted by `(host_port, protocol)`, includes `host_port`, `host_ip`, `container`, `container_port`, and `protocol` for each binding. Skips exited containers and internal-only ports (`publicPort=null`). Reuses the existing `details` GraphQL query — no schema changes. Replaces the N-call pattern of iterating `docker/details` per container when answering "what's using host port X" or "what ports are taken before deploying a new container."
- **Unit tests** for `docker/ports` covering: aggregation across multiple running containers (sorted), skipping exited containers, skipping internal-only ports, host-network containers (empty `ports[]`), multi-port containers emitting one binding each, empty container list, unnamed-container fallback, query-reuse verification, case-insensitive state matching (parametrized over multiple casings), and protocol tie-break ordering when two bindings share a host port.

### Changed

- Docker subaction count updated from 7 → 8 across docs (`README.md`, `docs/README.md`, `CLAUDE.md`, `.claude-plugin/README.md`, `docs/mcp/TOOLS.md`, `docs/stack/ARCH.md`) and the `unraid` tool's inline help table.
- Top-level subaction count updated from 107 → 108 across all referenced docs (`CLAUDE.md`, `docs/mcp/CLAUDE.md`, `docs/README.md`, `docs/INVENTORY.md`, `docs/MARKETPLACE.md`, `docs/PUBLISHING.md`, `docs/repo/MEMORY.md`, `docs/mcp/TOOLS.md`, `.claude-plugin/README.md`, `unraid_mcp/tools/__init__.py`).
- `tests/test_docker.py` per-file-ignores in `pyproject.toml` extended with `S104` to permit `"0.0.0.0"` literals in mock Docker port fixtures (narrowed from `tests/**/*.py` to the only file that needs it after PR review).

### Fixed

- **`docker/ports` state check** is now case-insensitive (`(state or "").upper() == "RUNNING"`), matching the defensive pattern in `_health.py`. Prevents silent zero-binding returns if the Unraid GraphQL API ever returns lowercase state values.

## [1.3.8] - 2026-04-15

### Changed
- Repository maintenance updates committed from the current working tree.
- Version-bearing manifests synchronized to 1.3.8.


## [1.3.7] - 2026-04-05

### Fixed
- **`bin/bump-version.sh`**: Fixed gemini path — always resolved the wrong `.gemini-extension.json` default before the conditional override; now prefers `gemini-extension.json` with dot-prefix as fallback. Added empty-version guard. Merged two `sed -i` calls per file into one with `-e`.
- **`bin/ensure-ignore-files.sh`**: Fixed `"scripts"` → `"bin"` in `REQUIRED_DOCKER` array (was appending wrong dockerignore entry); fixed stale `scripts/` and `hooks/scripts/` path references in comments.
- **`bin/validate-marketplace.sh`**: Replaced `eval` with `bash -c`; replaced `python3` subprocess for version read with `jq`.
- **`bin/check-docker-security.sh`**, **`bin/check-no-baked-env.sh`**, **`bin/check-outdated-deps.sh`**: Fixed stale `scripts/` path references in header comments.
- **`tests/test_bump_version.bats`**: Renamed `TMPDIR` → `TEST_DIR` to avoid shadowing POSIX system variable; last test now uses an isolated symlinked copy instead of mutating real repo files.
- **Stale `scripts/` references**: Updated all remaining references from `scripts/` to `bin/` in `.github/workflows/ci.yml`, `.pre-commit-config.yaml`, `Justfile`, `docs/CHECKLIST.md`, `docs/INVENTORY.md`, `docs/MARKETPLACE.md`, `docs/repo/SCRIPTS.md`, and `docs/repo/REPO.md`. The `hooks/scripts/` and `skills/unraid/scripts/` paths are intentional and unchanged.

## [1.3.6] - 2026-04-05

### Added
- **`tests/test_bump_version.bats`**: 9 bats tests for `bin/bump-version.sh` covering explicit version, patch/minor/major keywords, all-files-in-sync, output format, and dirname fallback.

### Changed
- **`bin/bump-version.sh`**: Uses `CLAUDE_PLUGIN_ROOT` as repo root override (set automatically by plugin runtime in hook contexts); falls back to dirname detection for direct dev use.
- **`bin/`**: Renamed from `scripts/` — moved all scripts to `bin/`.

## [1.3.5] - 2026-04-05

### Added
- **`scripts/bump-version.sh`**: One-command version bump across all four version-bearing files. Supports explicit version or `major`/`minor`/`patch` keywords.

## [1.3.4] - 2026-04-05

### Changed
- **SessionStart hook**: Removed `install-deps.sh` script; hook command is inline again per Claude Code plugin docs pattern.

## [1.3.3] - 2026-04-05

### Changed
- **`install-deps.sh`**: Added Rust/Cargo support (`Cargo.lock` → `cargo build --release` into `${CLAUDE_PLUGIN_DATA}/target`).

## [1.3.2] - 2026-04-05

### Changed
- **SessionStart hook**: Extracted inline uv command into `.claude-plugin/install-deps.sh` — a language-agnostic script that detects the package manager from lock files (uv, npm, yarn, pnpm) and installs deps into `${CLAUDE_PLUGIN_DATA}`.

## [1.3.1] - 2026-04-05

### Changed
- **`.mcp.json`**: Added all server env vars with defaults; removed `UNRAID_CREDENTIALS_DIR` (container-only override, not user-facing).

## [1.3.0] - 2026-04-05

### Added
- **SessionStart hook**: `plugin.json` now installs Python deps via `uv sync` into `${CLAUDE_PLUGIN_DATA}/.venv` on first run and on any `uv.lock` change — fixes "server failed to start" for users installing via the plugin system.
- **Persistent venv**: MCP server command uses `UV_PROJECT_ENVIRONMENT=${CLAUDE_PLUGIN_DATA}/.venv` so the installed venv survives plugin updates without reinstalling on every session.

### Changed
- **`.mcp.json`**: Added `UV_PROJECT_ENVIRONMENT=${CLAUDE_PLUGIN_DATA}/.venv` and `--project ${CLAUDE_PLUGIN_ROOT}` so the MCP server uses the persisted venv installed by the hook.

## [1.2.5] - 2026-04-05

### Changed
- **CI gating**: `mcp-integration` now runs only when both `UNRAID_API_URL` and `UNRAID_API_KEY` secrets are present, preventing fork and unconfigured-repo runs from failing on live integration setup.
- **Plugin manifests**: Claude plugin manifest now points to `./.mcp.json` instead of embedding an inline MCP server definition; version-bearing files synchronized to `1.2.5`.

## [1.2.4] - 2026-04-04

### Added
- **Comprehensive test suite**: Added tests for core modules, configuration, validation, subscriptions, and edge cases
- **Test coverage documentation**: `tests/TEST_COVERAGE.md` with coverage map and gap analysis

### Changed
- **Documentation**: Comprehensive updates across CLAUDE.md, README, and reference docs
- **Version sync**: Fixed `pyproject.toml` version mismatch (was 1.2.2, now aligned with all manifests at 1.2.4)

## [1.2.3] - 2026-04-03

### Changed
- **hooks/hooks.json**: Removed `SessionStart` hook — `sync-env.sh` was exiting 1 on every session start when `UNRAID_MCP_BEARER_TOKEN` was not set via plugin userConfig, causing startup hook errors.

## [1.2.2] - 2026-04-03

### Changed
- **README**: Restructured to a compact reference format — removed marketing prose, replaced with minimal tables and direct headings.
- **CHANGELOG**: Adopted Keep a Changelog format.
- **Version sync**: `.codex-plugin/plugin.json` and `gemini-extension.json` brought to 1.2.2 (were stale at 1.2.0).

## [1.2.1] - 2026-04-03

### Fixed
- **OAuth discovery 401 cascade** (fixes [#17](https://github.com/jmagar/unraid-mcp/issues/17)): `BearerAuthMiddleware` was blocking `GET /.well-known/oauth-protected-resource`, causing MCP clients (e.g. Claude Code) to surface a generic "unknown error" after receiving a 401. Added `WellKnownMiddleware` (RFC 9728) placed before `BearerAuthMiddleware` that returns resource metadata with `bearer_methods_supported: ["header"]` and no `authorization_servers` — telling clients to use a pre-configured Bearer token rather than attempting an OAuth flow.

### Added
- **`docs/AUTHENTICATION.md`**: New setup guide covering token generation, server config, Claude Code client config (`"Authorization": "Bearer <token>"` header format), and troubleshooting for common 401 errors.
- **README Authentication section**: Added the missing `## 🔐 Authentication` section (was linked in TOC but not present) with quick-start examples and a link to the full guide.

## [1.2.0] - 2026-03-30

### Added
- **HTTP bearer token auth**: ASGI-level `BearerAuthMiddleware` (pure `__call__` pattern, no BaseHTTPMiddleware overhead) enforces `Authorization: Bearer <token>` on all HTTP requests. RFC 6750 compliant — missing header returns `WWW-Authenticate: Bearer realm="unraid-mcp"`, invalid token adds `error="invalid_token"`.
- **Auto token generation**: On first HTTP startup with no token configured, a `secrets.token_urlsafe(32)` token is generated, written to `~/.unraid-mcp/.env` (mode 600), announced once on STDERR without printing the secret, and removed from `os.environ` so subprocesses cannot inherit it.
- **Per-IP rate limiting**: 60 failed auth attempts per 60 seconds → 429 with `Retry-After: 60` header.
- **Gateway escape hatch**: `UNRAID_MCP_DISABLE_HTTP_AUTH=true` bypasses bearer auth for users who handle authentication at a reverse proxy / gateway layer.
- **Startup guard**: Server refuses to start in HTTP mode (`streamable-http`/`sse`) if no token is set and `UNRAID_MCP_DISABLE_HTTP_AUTH` is not explicitly enabled.
- **Tests**: 23 new tests in `tests/test_auth.py` covering pass-through scopes, 401/429 responses, RFC 6750 header differentiation, per-IP rate limiting, window expiry, token generation, and startup guard.

### Changed
- **Default transport**: `stdio` → `streamable-http`. Users running directly (not via Claude Desktop plugin) will now get an HTTP server by default. To keep stdio behaviour, set `UNRAID_MCP_TRANSPORT=stdio`. The Claude Desktop plugin (`plugin.json`) is unaffected — it hardcodes `stdio`.
- **`.env.example`**: Updated to document new auth variables (`UNRAID_MCP_BEARER_TOKEN`, `UNRAID_MCP_DISABLE_HTTP_AUTH`) and updated default transport comment.

### Breaking Changes
- **Default transport is now `streamable-http`**. Any script or service that relied on the default being `stdio` must explicitly set `UNRAID_MCP_TRANSPORT=stdio`.

## [1.1.6] - 2026-03-30

### Security

- **Path traversal**: `flash_backup` source path now validated after `posixpath.normpath` (not before) — raw-string `..` check was bypassable via encoded sequences like `foo/bar/../..`; null byte guard added
- **Key validation**: `DANGEROUS_KEY_PATTERN` now blocks space (0x20) and DEL (0x7f) in addition to existing shell metacharacters; applies to both rclone and settings key validation

### Fixed

- **Settings validation**: `configure_ups` input now validated via `_validate_settings_input` before mutation — was previously passing unvalidated dict directly to GraphQL
- **Subscription locks**: `_start_one` `last_error` write and `stop_all()` keys snapshot both now take `_task_lock` to prevent concurrent write/read races
- **Keepalive handling**: Removed `"ping"` from keepalive `elif` — ping messages require a pong response, not silent discard; only `"ka"` and `"pong"` are silently dropped
- **Middleware import**: `middleware_refs.py` `ErrorHandlingMiddleware` import changed from `TYPE_CHECKING`-only to unconditional — `isinstance()` calls at runtime were silently broken
- **Health reverse map**: `_STATUS_FROM_SEVERITY` dict hoisted to module level — was being rebuilt on every `_comprehensive_health_check` call

### Changed

- **Log content cap**: `_cap_log_content` now skipped for non-log subscriptions (only `log_tail`/`logFileSubscription` have `content` fields) — reduces unnecessary dict key lookups on every WebSocket message
- **Live assertion**: `_handle_live` now raises `RuntimeError` at import time if `COLLECT_ACTIONS` contains keys not in `_HANDLED_COLLECT_SUBACTIONS` — catches handler omissions before runtime
- **Subscription name guard**: `start_subscription` validates name matches `^[a-zA-Z0-9_]+$` before use as WebSocket message ID

### Added

- **Tests**: 27 parametrized tests for `DANGEROUS_KEY_PATTERN` covering all documented dangerous characters and safe key examples (`tests/test_validation.py`)
- **Tests**: `test_check_api_error_wrapped_tool_error` — verifies health check returns `{status: unhealthy}` when `make_graphql_request` raises `ToolError` wrapping `httpx.ConnectError`

## [1.1.5] - 2026-03-27

### Added
- **Beads issue tracking**: `bd init` — Dolt-backed issue tracker with prefix `unraid-mcp-<hash>`, hooks, and AGENTS.md integration
- **Lavra project config**: `.lavra/config/project-setup.md` — stack `python`, review agents (kieran-python-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle)
- **Codebase profile**: `.lavra/config/codebase-profile.md` — auto-generated stack/architecture/conventions reference for planning and review commands

### Changed
- **`.gitignore`**: Added lavra session-state exclusion (`.lavra/memory/session-state.md`) and beads-related entries
- **`CLAUDE.md`**: Added beads workflow integration block with mandatory `bd` usage rules and session completion protocol

## [1.1.4] - 2026-03-25

### Changed
- **Plugin branding**: `displayName` set to `unRAID` in `plugin.json` and `marketplace.json`
- **Plugin description**: Expanded to list all 3 tools and all 15 action domains with full subaction inventory (107 subactions, destructive actions marked with `*`)

## [1.1.3] - 2026-03-24

### Fixed
- **Docs accuracy**: `disk/logs` docs corrected to use `log_path`/`tail_lines` parameters (were `path`/`lines`)
- **Docs accuracy**: `rclone/create_remote` docs corrected to `provider_type`/`config_data` (were `type`/`fields`)
- **Docs accuracy**: `setting/update` docs corrected to `settings_input` parameter (was `settings`)
- **Docs accuracy**: `key/create` now documents `roles` as optional; `add_role`/`remove_role` corrected to `roles` (plural)
- **Docs accuracy**: `oidc/validate_session` now documents required `token` parameter
- **Docs accuracy**: `parity_start` quick-reference example now includes required `correct=False`
- **Docs accuracy**: `log_tail` README example now includes required `path="/var/log/syslog"`
- **Docs accuracy**: `live/parity_progress` added to event-driven subscriptions list in troubleshooting guide
- **Docs accuracy**: `live/array_state` wording softened — "may show connecting indefinitely" vs "will always show"
- **Markdown**: `endpoints.md` top-level heading moved before blockquote disclaimer (MD041)
- **Tests**: `test_resources.py` now uses `_get_resource()` helper instead of raw `mcp.providers[0]._components[...]` access; isolates FastMCP internals to one location

---

## [1.1.2] - 2026-03-23

### Security
- **Path traversal**: Removed `/mnt/` from `_ALLOWED_LOG_PREFIXES` — was exposing all Unraid user shares to path-based reads
- **Path traversal**: Added early `..` detection for `disk/logs` and `live/log_tail` before any filesystem access; added `/boot/` prefix restriction for `flash_backup` source paths
- **Timing-safe auth**: `verify_token` now uses `hmac.compare_digest` instead of `==` to prevent timing oracle attacks on API key comparison
- **Traceback leak**: `include_traceback` in `ErrorHandlingMiddleware` is now gated on `DEBUG` log level; production deployments no longer expose stack traces

### Fixed
- **Health check**: `_comprehensive_health_check` now re-raises `CredentialsNotConfiguredError` instead of swallowing it into a generic unhealthy status
- **UPS device query**: Removed non-existent `nominalPower` and `currentPower` fields from `ups_device` query — every call was failing against the live API
- **Stale credential bindings**: Subscription modules (`manager.py`, `snapshot.py`, `utils.py`, `diagnostics.py`) previously captured `UNRAID_API_KEY`/`UNRAID_API_URL` at import time; replaced with `_settings.ATTR` call-time access so `apply_runtime_config()` updates propagate correctly after credential elicitation

### Added
- **CI pipeline**: `.github/workflows/ci.yml` with 5 jobs — lint (`ruff`), typecheck (`ty`), test (`pytest -m "not integration"`), version-sync check, and `uv audit` dependency scan
- **Coverage threshold**: `fail_under = 80` added to `[tool.coverage.report]`
- **Version sync check**: `scripts/validate-marketplace.sh` now verifies `pyproject.toml` and `plugin.json` versions match

### Changed
- **Docs**: Updated `CLAUDE.md`, `README.md` to reflect 3 tools (1 primary + 2 diagnostic); corrected system domain count (19→18); fixed scripts comment
- **Docs**: `docs/AUTHENTICATION.md` H1 retitled to "Authentication Setup Guide"
- **Docs**: Added `UNRAID_CREDENTIALS_DIR` commented entry to `.env.example`
- Removed `from __future__ import annotations` from `snapshot.py` (caused TC002 false positives with FastMCP)
- Added `# noqa: ASYNC109` to `timeout` parameters in `_handle_live` and `unraid()` (valid suppressions)
- Fixed `start_array*` → `start_array` in tool docstring table (`start_array` is not in `_ARRAY_DESTRUCTIVE`)

### Refactored
- **Path validation**: Extracted `_validate_path()` in `unraid.py` — consolidates traversal check, `normpath`, and prefix validation used by both `disk/logs` and `live/log_tail` into one place; eliminates duplication
- **WebSocket auth payload**: Extracted `build_connection_init()` in `subscriptions/utils.py` — removes 4 duplicate `connection_init` blocks from `snapshot.py` (×2), `manager.py`, and `diagnostics.py`; also fixes a bug in `diagnostics.py` where `x-api-key: None` was sent when no API key was configured
- Removed `_LIVE_ALLOWED_LOG_PREFIXES` alias — direct reference to `_ALLOWED_LOG_PREFIXES`
- Moved `import hmac` to module level in `server.py` (was inside `verify_token` hot path)

---

## [1.1.1] - 2026-03-16

### Added
- **API key auth**: `Authorization: Bearer <UNRAID_MCP_API_KEY>` bearer token authentication via `ApiKeyVerifier` — machine-to-machine access without OAuth browser flow
- **MultiAuth**: When both Google OAuth and API key are configured, `MultiAuth` accepts either method
- **Google OAuth**: Full `GoogleProvider` integration — browser-based OAuth 2.0 flow with JWT session tokens; `UNRAID_MCP_JWT_SIGNING_KEY` for stable tokens across restarts
- **`fastmcp.json`**: Dev tooling configs for FastMCP

### Fixed
- Auth test isolation: use `os.environ[k] = ""` instead of `delenv` to prevent dotenv re-injection between test reloads

---

## [1.1.0] - 2026-03-16

### Breaking Changes
- **Tool consolidation**: 15 individual domain tools (`unraid_docker`, `unraid_vm`, etc.) merged into single `unraid` tool with `action` + `subaction` routing
  - Old: `unraid_docker(action="list")`
  - New: `unraid(action="docker", subaction="list")`

### Added
- **`live` tool** (11 subactions): Real-time WebSocket subscription snapshots — `cpu`, `memory`, `cpu_telemetry`, `array_state`, `parity_progress`, `ups_status`, `notifications_overview`, `notification_feed`, `log_tail`, `owner`, `server_status`
- **`customization` tool** (5 subactions): `theme`, `public_theme`, `is_initial_setup`, `sso_enabled`, `set_theme`
- **`plugin` tool** (3 subactions): `list`, `add`, `remove`
- **`oidc` tool** (5 subactions): `providers`, `provider`, `configuration`, `public_providers`, `validate_session`
- **Persistent `SubscriptionManager`**: `unraid://live/*` MCP resources backed by long-lived WebSocket connections with auto-start and reconnection
- **`diagnose_subscriptions`** and **`test_subscription_query`** diagnostic tools
- `array`: Added `parity_history`, `start_array`, `stop_array`, `add_disk`, `remove_disk`, `mount_disk`, `unmount_disk`, `clear_disk_stats`
- `keys`: Added `add_role`, `remove_role`
- `settings`: Added `update_ssh` (confirm required)
- `stop_array` added to `_ARRAY_DESTRUCTIVE`
- `gate_destructive_action` helper in `core/guards.py` — centralized elicitation + confirm guard
- Full safety test suite: `TestNoGraphQLCallsWhenUnconfirmed` (zero-I/O guarantee for all 13 destructive actions)

### Fixed
- Removed 29 actions confirmed absent from live API v4.29.2 via GraphQL introspection (Docker organizer mutations, `unassignedDevices`, `warningsAndAlerts`, etc.)
- `log_tail` path validated against allowlist before subscription start
- WebSocket auth uses `x-api-key` connectionParams format

---

## [1.0.0] - 2026-03-14 through 2026-03-15

### Breaking Changes
- Credential storage moved to `~/.unraid-mcp/.env` (dir 700, file 600); all runtimes load from this path
- `unraid_health(action="setup")` is the only tool that triggers credential elicitation; all others propagate `CredentialsNotConfiguredError`

### Added
- `CredentialsNotConfiguredError` sentinel — propagates cleanly through `tool_error_handler` with exact credential path in the error message
- `is_configured()` and `apply_runtime_config()` in `settings.py` for runtime credential injection
- `elicit_and_configure()` with `.env` persistence and confirmation before overwrite
- 28 GraphQL mutations across storage, docker, notifications, and new settings tool
- Comprehensive test suite expansion: schema validation (99 tests), HTTP layer (respx), property tests, safety audit, contract tests

### Fixed
- Numerous PR review fixes across 50+ commits (CodeRabbit, ChatGPT-Codex review rounds)
- Shell scripts hardened against injection and null guards
- Notification enum validation, subscription lock split, safe_get semantics

---

## [0.6.0] - 2026-03-15

### Added
- Subscription byte/line cap to prevent unbounded memory growth
- `asyncio.timeout` bounds on `subscribe_once` / `subscribe_collect`
- Partial auto-start for subscriptions (best-effort on startup)

### Fixed
- WebSocket URL scheme handling (`ws://`/`wss://`)
- `flash_backup` path validation and smoke test assertions

---

## [0.5.0] - 2026-03-15

*Tool expansion and live subscription foundation.*

---

## [0.4.x] - 2026-03-13 through 2026-03-14

*Credential elicitation system, per-tool refactors, and mutation additions.*

---

## [0.2.x] - 2026-02-15 through 2026-03-13

*Initial public release hardening: PR review cycles, test suite expansion, security fixes, plugin manifest.*

---

## [0.1.0] - 2026-02-08

### Added
- Consolidated 26 tools into 10 tools with 90 actions
- FastMCP architecture migration with `uv` toolchain
- Docker Compose support with health checks
- WebSocket subscription infrastructure

---

*Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning: [Semantic Versioning](https://semver.org/).*
