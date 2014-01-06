(function(){
	"use strict";
	//Dependencies: utils, touch

	var createControlElement = function(name, context){
		context[name] = document.createElement('div');
		context[name].className = 'slider-' + name;
		context.element.appendChild(context[name]);
	};

	var CurveSlider = function(element, points, options){
		var that = this;

		this.version = '0.1.0';
		this.element = utils.getElement(element);
		this.min = 0;
		this.max = 100;
		this.value = this.min;
		this.points = points || [];
		this.fastMove = false;

		Object.keys(options).forEach(function(option){
			this[option] = options[option];
		}, this);

		createControlElement('handler', this);
		['start', 'move', 'end'].forEach(function(eventName){
			element.addEventListener(touch.events[eventName], this, false);
		}, this);

		this.labels = [];
		this.isEnable = true;
		this.wasTouched = false;
		this.wasMoved = false;
		this.onInit = function(){};
		this.onChange = function(){};
		this.onFinalChange = function(){};
		this.parentSlideElement = utils.getElementParent(this.element, 'article');
		app.slides.onenter(this.parentSlideElement.id, function(){
			setTimeout(function(){
				that.onInit();
				that.refresh();
			}, 0);
		});
	};
	CurveSlider.prototype.handleEvent = function(event){
		var length = event.touches ? event.touches.length : 1;
		event.stopPropagation();
		event.preventDefault();
		if(this.isEnable && length <= 1){
			switch(event.type){
				case touch.events.start:
					this.wasTouched = true;
					this.wasMoved = false;
					break;
				case touch.events.move:
					this.wasMoved = true;
					if(this.wasTouched){
						this.moveEvent(event);
						this.updateLabels();
						this.onChange();
					}
					break;
				case touch.events.end:
					if(this.fastMove && this.wasTouched && !this.wasMoved){
						this.moveEvent(event);
						this.updateLabels();
						this.onChange();
					}
					this.wasTouched = false;
					this.wasMoved = false;
					this.onFinalChange();
					break;
			}
		}
	};
	CurveSlider.prototype.moveEvent = function(event){
		var translate;
		event = touch.getOriginalEvent(event);
		if(this.inverted){
			translate = this.element.offsetHeight - (event['client' + this.axis] - this.elementOffset);
		}else{
			translate = event['client' + this.axis] - this.elementOffset;
		}
		translate = this.getTranslate(translate);
		this.value = Math.round(translate / this.fold) + this.min;
		if(this.strictValue){
			translate = (this.value - this.min) * this.fold;
		}
		this.translate = translate;
		this.updateControls(translate);
	};
	CurveSlider.prototype.getTranslate = function(translate){
		translate -= this.halfOfHandlerSize;
		if(translate < this.minTranslate){
			translate = this.minTranslate;
		}else if(translate > this.maxTranslate){
			translate = this.maxTranslate;
		}
		return translate;
	};
	CurveSlider.prototype.updateControls = function(translate){
		var xPercent, y = 0, angle = 0,
			handlerHeight = this.handler.offsetHeight,
			that = this;
		//get current x-point
		this.points.forEach(function(point, i){
			if( i > 0 && translate < that.points[i][0] && translate > that.points[i-1][0] ){
				// current slider position between two defined points in percents
				xPercent = translate * 100 / that.points[i][0] / 100;
				if( that.points[i-1][1] > that.points[i][1] ){
					y = ( that.points[i-1][1] - that.points[i][1] ) * xPercent + that.points[i][1];
				} else if( that.points[i-1][1] < that.points[i][1] ){
					y = ( that.points[i][1] - that.points[i-1][1] ) * xPercent + that.points[i-1][1];
				}
				else{
					y = that.points[i][1];
				}
				y -= handlerHeight;
				angle = that.points[i][2];
			}
		});
		if(this.fill){
			this.fill.style.cssText = (this.axis === 'Y' ? 'height: ' : 'width: ') + (translate + this.halfOfHandlerSize) + 'px';
		}
		translate = this.inverted ? this.element.offsetHeight - translate : translate;
		this.handler.style.cssText = '-webkit-transform: translate3d(' + (translate) + 'px, ' + y + 'px, 0) rotate('+ angle +'deg);';
	};
	CurveSlider.prototype.refresh = function(){
		var elementOffsetWidth = this.element.offsetWidth,
			elementOffsetHeight = this.element.offsetHeight,
			handlerSize, elementSize, needPosition;
		if(elementOffsetWidth >= elementOffsetHeight){
			this.axis = 'X';
			needPosition = 'left';
			handlerSize = this.handler.offsetWidth;
			elementSize = elementOffsetWidth;
		}else{
			this.axis = 'Y';
			needPosition = 'top';
			handlerSize = this.handler.offsetHeight;
			elementSize = elementOffsetHeight;
		}
		this.halfOfHandlerSize = handlerSize / 2;
		this.minTranslate = 0;
		this.maxTranslate = elementSize - handlerSize;
		this.fold = this.maxTranslate / (this.max - this.min);
		this.elementOffset = this.element.getBoundingClientRect()[needPosition] - this.parentSlideElement.getBoundingClientRect()[needPosition];
	};
	CurveSlider.prototype.setValue = function(value, shouldCallChangeHandler){
		if(value >= this.min && value <= this.max){
			this.value = value;
			this.updateControls((value - this.min) * this.fold);
			if(shouldCallChangeHandler){
				this.onChange();
				this.updateLabels();
			}
		}
	};
	CurveSlider.prototype.addLabel = function(element, pattern){
		this.labels.push({element:element, pattern:pattern || 'N'});
	};
	CurveSlider.prototype.updateLabels = function(){
		this.labels.forEach(function(label){
			label.element.innerText = label.pattern.replace('N', this.value);
		}, this);
	};
	window.CurveSlider = CurveSlider;
})();