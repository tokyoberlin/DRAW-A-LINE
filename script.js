const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const infoDiv = document.getElementById("info");
const coordinatesDiv = document.getElementById("coordinates");
const coordinatesText = document.getElementById("coordinatesText");

let path = [];

function findBrightestPoint(imageData, threshold) {
  let brightestIndex = 0;
  let brightestValue = -1;

  for (let i = 0; i < imageData.length; i += 4) {
    const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;

    if (brightness > brightestValue && brightness > threshold) {
      brightestValue = brightness;
      brightestIndex = i / 4; // Convert index to pixel position
    }
  }

  const x = brightestIndex % canvas.width;
  const y = Math.floor(brightestIndex / canvas.width);

  return { x, y, brightness: brightestValue, rgb: [imageData[brightestIndex * 4], imageData[brightestIndex * 4 + 1], imageData[brightestIndex * 4 + 2]] };
}

function drawBrightestPoint(brightestPoint) {
  context.fillStyle = "black";
  context.beginPath();
  context.arc(brightestPoint.x, brightestPoint.y, 2.5, 0, Math.PI * 2);
  context.fill();

  // Connect consecutive points with a line
  path.push(brightestPoint);

  // Adjust x-coordinates of points for the leftward movement
  path.forEach((point, index) => {
    point.x -= 2;
    context.beginPath();
    context.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
    context.fill();

    if (index > 0) {
      context.beginPath();
      context.moveTo(path[index - 1].x, path[index - 1].y);
      context.lineTo(point.x, point.y);
      context.strokeStyle = "black";
      context.stroke();
    }
  });

  // Remove points that have moved off the canvas
  path = path.filter((point) => point.x > 0);

  // Display coordinates in real-time
  coordinatesDiv.innerHTML = `X: ${brightestPoint.x}, Y: ${brightestPoint.y}`;
}

function updateCanvas(video) {
  context.save();
  context.scale(-1, 1);
  context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  context.restore();

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const threshold = 250;

  const currentBrightestPoint = findBrightestPoint(imageData, threshold);

  infoDiv.innerHTML = `Brightest Point: X=${currentBrightestPoint.x}, Y=${currentBrightestPoint.y}, RGB=[${currentBrightestPoint.rgb}]`;

  if (currentBrightestPoint.brightness > threshold) {
    drawBrightestPoint(currentBrightestPoint);
  }

  // Update the coordinates text
  coordinatesText.innerHTML = `X: ${currentBrightestPoint.x}, Y: ${currentBrightestPoint.y}`;
}

function startAnimationLoop(video) {
  requestAnimationFrame(function update() {
    updateCanvas(video);
    requestAnimationFrame(update);
  });
}

function initCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.addEventListener("loadedmetadata", function () {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        document.body.appendChild(canvas);

        startAnimationLoop(video);
      });
    })
    .catch(function (error) {
      console.error("Error accessing the camera: ", error);
    });
}

initCamera();
