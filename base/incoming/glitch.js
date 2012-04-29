
			
			/*
			 * ImageGlitcher by Felix Turner - http://www.airtight.cc
 			 * Image processing via BitmapData.js - http://peternitsch.net/bitmapdata.js/
 			 * Read pixel access on cross-domain images via $.getImageData - http://www.maxnov.com/getimagedata/
 			 */
			
			var _glitchAmount = 5;
			var _canvas;
			var _context;
			var _inputImage;

			//init
			$(document).ready( function() {

				_canvas = document.getElementById("canvas");
				_context = _canvas.getContext("2d");

				//init buttons
				$("#glitchImage").click( function() {
					glitchImage();
				});
				
				$("#saveImage").click( function() {
					//open canvas image in new tab 
					window.open(document.getElementById("canvas").toDataURL());
				});

				$("#loadImage").click( function() {
					loadImage();
				});
				
				$(".thumb").click( function() {
					loadImage();
					
					//get image URL from thumb URL
					_inputImage = new Image();
					_inputImage.src = ("img/" + this.id + ".jpg");
					
					_inputImage.onload = function() {
						onImageLoaded();
					};
					
				});
				
				$("#url_field").keypress(function(e) {
					if(e.keyCode == 13) {
						loadImage();
					}
				});
				
				//detect for filereader drag and drop support
				if (typeof(FileReader) != "undefined"){
					
					//image drag and drop
					//Chrome and FireFox only
					window.addEventListener('dragover', function(event){
						event.preventDefault();
					}, false);
					
					window.addEventListener('drop', function(event){
						event.preventDefault();
						
						var file = event.dataTransfer.files[0];
						var fileType = file.type;
						if (!fileType.match(/image\/\w+/)) {
							$("#debug").text("Only image files supported.");
							return;
						}
						
						var reader = new FileReader();
						reader.onload = function(){
						
							_inputImage = new Image();
							_inputImage.src = reader.result;
							
							_inputImage.onload = function(){
								onImageLoaded();
							};
						};
						reader.readAsDataURL(file);
					}, false);
					
					//display drag message
					_context.fillStyle = "#888;"
					_context.font = "bold 20px sans-serif";
					_context.textAlign = "center";
					_context.shadowOffsetX = 1;
					_context.shadowOffsetY = 1;
					_context.shadowBlur    = 2;
					_context.shadowColor   = 'rgba(255, 255, 255, 0.5)';
					_context.fillText("Drag And Drop Images Here", _canvas.width/2, _canvas.height/2);
				}
			});
			
			function loadImage(){
				var url = $("#url_field").val();
				//detect if image url is local
				if (url.indexOf("http://") == -1) {
					_inputImage = new Image();
					_inputImage.src = url;
					_inputImage.onload = function() {
						onImageLoaded();
					};
					_inputImage.onerror = function(){
						$("#debug").text("Image not found.");
					};
					
				} else {
					//use $.getImageData
					$.getImageData({
						url: url,
						success: onImageLoadRemote,
						error: function(xhr, text_status) {
							//show error message
							$("#debug").text("Image not found.");
						}
					});
				}
			}
			
			function onImageLoadRemote(inImage) {
				_inputImage = inImage;
				onImageLoaded();
			}
			
			function onImageLoaded() {
				if (_inputImage.width > 1024 || _inputImage.height > 1024) {
					// large images are too slow
					$("#debug").text("Image must be smaller than 1024 x 1024");
				} else {
					$("#canvas").attr('width', _inputImage.width);
					$("#canvas").attr('height', _inputImage.height);
					//draw to canvas
					_context.drawImage(_inputImage, 0, 0);
					$("#debug").text("Image Loaded");
				}			
			}

			function glitchImage(){
				$("#debug").text("Glitching... ");
				//break into 2 functions to allow status text to update
				setTimeout(glitchImage2, 0);
			}
				
			function glitchImage2(){
				
				var start = new Date().getTime();
				
				var iw = _inputImage.width;
				var ih = _inputImage.height;
				
				//draw input image to output canvas
				outputBMD = new BitmapData(iw, ih);
				outputBMD.draw(_inputImage);
				
				//init inputBMD
				inputBMD = new BitmapData(iw, ih);
				inputBMD.draw(_inputImage);
				var maxOffset = _glitchAmount * _glitchAmount / 100 * iw;
				
				//randomly offset slices horizontally
				for (i = 0; i < _glitchAmount * 2; i++) {

					var startY = getRandInt(0, ih);
					var chunkHeight = getRandInt(1, ih / 4);
					chunkHeight = Math.min(chunkHeight, ih - startY);
					var offset = getRandInt(-maxOffset, maxOffset);

					if (offset == 0)
						continue;
					
					if (offset < 0) {
						//shift left
						outputBMD.copyPixels(inputBMD, new Rectangle(-offset, startY, iw + offset, chunkHeight), new Point(0, startY));
						//wrap around
						outputBMD.copyPixels(inputBMD, new Rectangle(0, startY, -offset, chunkHeight), new Point(iw + offset,startY));

					} else {
						//shuft right
						outputBMD.copyPixels(inputBMD, new Rectangle(0, startY, iw, chunkHeight), new Point(offset, startY));
						//wrap around
						outputBMD.copyPixels(inputBMD, new Rectangle(iw - offset, startY, offset, chunkHeight), new Point(0, startY));
					}

				}
				
				//do color offset
				var channel = getRandChannel();
				outputBMD.copyChannel(inputBMD, new Rectangle(0, 0, iw, ih), new Point(getRandInt(-_glitchAmount * 2, _glitchAmount * 2), getRandInt(-_glitchAmount * 2, _glitchAmount * 2)), channel, channel);

				//make brighter
				var brightMat=[
										2, 0, 0, 0, 0,
										0, 2, 0, 0, 0,
										0, 0, 2, 0, 0,
										0, 0, 0, 1, 0
									 ];
				
				zeroPoint = new Point();
				brightnessFilter = new ColorMatrixFilter(brightMat);
				outputBMD.applyFilter(outputBMD, outputBMD.rect, zeroPoint, brightnessFilter);

				//Add Scan Lines
				var line = new Rectangle(0, 0, iw, 1);

				for (i = 0; i < ih; i++) {
					if (i % 2 == 0) {
						line.y = i;
						outputBMD.fillRect(line, 0);
					}
				}

				//draw to canvas
				_context.putImageData(outputBMD.data, 0, 0);

				//log time
				var end = new Date().getTime();
				$("#debug").text("Completed in  " + (end - start) + " ms");
				

			};

			//handle range input
			function setSliderValue(newValue) {
				if (newValue > 10) newValue = 10;
				if (newValue < 1) newValue = 1;
				document.getElementById("rangeOut").innerHTML = newValue;
				_glitchAmount = newValue;
			}

			function getRandInt(min, max) {
				return (Math.floor(Math.random() * (max - min) + min));
			}
			
			function getRandChannel() {
				var r = Math.random();
				if (r < .33){
					 return BitmapDataChannel.GREEN;
				}else if (r > .33 && r < .66){
					return BitmapDataChannel.RED;
				}else{
					return BitmapDataChannel.BLUE;
				}
			}
