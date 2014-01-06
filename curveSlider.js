(function(){
	"use strict";
	//Dependencies: utils, touch

	var points = [
			[-1,221,0],
			[1,221,0],
			[10,221,0],
			[23,221,0],
			[36,223,0],
			[50,223,0],
			[63,223,0],
			[77,223,0],
			[91,223,0],
			[104,223,0],
			[118,223,-2],
			[131,222,-4],
			[143,221,-10],
			[155,218,-14],
			[167,215,-15],
			[178,212,-19],
			[189,208,-24],
			[200,202,-31],
			[209,196,-39],
			[217,188,-45],
			[225,180,-43],
			[233,173,-47],
			[240,164,-52],
			[247,155,-52],
			[254,146,-53],
			[261,139,-54],
			[267,128,-58],
			[272,119,-59],
			[279,109,-60],
			[285,99,-61],
			[290,89,-60],
			[297,80,-54],
			[304,70,-49],
			[311,63,-46],
			[319,54,-49],
			[326,46,-46],
			[334,38,-39],
			[343,32,-37],
			[351,25,-34],
			[367,18,-30],
			[372,14,-25],
			[384,10,-19],
			[396,6,-16],
			[407,3,-14],
			[420,1,-5],
			[433,1,2],
			[446,1,0],
			[460,1,2],
			[473,2,10],
			[484,5,12],
			[497,7,19],
			[506,12,24],
			[517,16,27],
			[526,22,34],
			[536,29,36],
			[544,35,43],
			[552,44,47],
			[560,52,48],
			[567,61,48],
			[575,69,51],
			[581,78,54],
			[588,87,55],
			[594,97,58],
			[601,108,60],
			[606,118,55],
			[613,126,54],
			[619,136,56],
			[625,144,52],
			[633,153,50],
			[640,162,50],
			[648,171,50],
			[655,179,49],
			[662,187,41],
			[671,193,33],
			[681,199,29],
			[691,204,26],
			[701,209,24],
			[711,213,23],
			[722,218,12],
			[736,218,7],
			[747,221,6],
			[758,221,5],
			[770,223,4],
			[782,222,0],
			[795,223,0],
			[807,221,0],
			[820,223,0],
			[831,221,0],
			[845,221,0],
			[859,221,0],
			[871,223,0],
			[883,222,0],
			[897,221,0],
			[909,222,0],
			[923,222,0],
			[936,222,0],
			[950,222,0]
		];

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