const AWS = require("aws-sdk");
const sharp = require("sharp");
const util = require("util");

const s3 = new AWS.S3();

const fileToThumbnail = async (inputFileName, bucketName) => {
  console.log(`Process file: ${inputFileName}`);
  const dstBucket = process.env.OUTPUT_BUCKET;
  const dstKey = `resized-${inputFileName}`;

  // 파일 접미사를 통해 이미지 타입을 유추함
  const typeMatch = inputFileName.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.log("Could not determine the image type.");
    return;
  }

  // 지원되는 이미지 유형인지 확인
  const imageType = typeMatch[1].toLowerCase();
  if (imageType !== "jpg" && imageType !== "png") {
    console.log(`Unsupported image type: ${imageType}`);
    return;
  }

  let originImage;
  try {
    const params = {
      Bucket: bucketName,
      Key: inputFileName
    };
    originImage = await s3.getObject(params).promise();
  } catch (error) {
    console.log(error);
    return;
  }

  // 썸네일 너비를 설정함. 크기 조정은 가로 세로 비율을 유지하기 위해 높이를 자동으로 설정함
  const width = ~~process.env.THUMB_WIDTH;

  console.log(originImage);

  // sharp 모듈을 사용하여 이미지 크기를 조정하고 buffer에 저장함
  let buffer;
  try {
    // 🚧 현재 에러가 나는 부분
    // originImage.Body는 buffer, resize까지는 되지만, toBuffer하는 과정에서
    // Error: Input buffer contains unsupported image format
    // 에러 발생
    buffer = await sharp(originImage.Body).resize(width).toBuffer(dstKey);
    console.log(`Buffer: ${buffer}`)
  } catch (error) {
    console.log(`Buffer error: `, error);
    return;
  }

  // 대상 s3 버킷에 이미지를 업로드함
  try {
    const destParams = {
      Bucket: dstBucket,
      Key: dstKey,
      Body: buffer,
      ContentType: "image"
    };

    const putResult = await s3.putObject(destParams).promise();

    console.log(`putResult: ${JSON.stringify(putResult)}`);
  } catch (error) {
    console.log(error);
    return;
  }

  console.log(
    `Successfully resized ${bucketName}/${inputFileName} and uploaded to ${dstBucket}/${dstKey}`
  );
};

exports.lambdaHandler = async (event, context, callback) => {
  console.log(`LogS3DataEvents`);
  console.log("Received event:", JSON.stringify(event, null, 2));

  const bucketName = event.detail.bucket.name;
  const inputFileName = decodeURIComponent(
    event.detail.object.key.replace(/\+/g, " ")
  );
  await fileToThumbnail(inputFileName, bucketName);
};
