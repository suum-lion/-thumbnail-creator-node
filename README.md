# thumbnail_creator_node

- 연결되는 프로젝트
- https://github.com/thumbsu/get-presigned-url
- s3 특정 버킷에 objectCreated 이벤트 발생시 thumbnail_creator의 함수가 트리거됨
- 🚧 이벤트는 정상 수신되며 이미지도 가져오지만, 이미지를 리사이즈 하는 sharp 모듈의 `toBuffer` 부분에서 에러가 발생함
