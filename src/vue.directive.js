import Vue from 'vue'

/** v-touching : 點擊中效果 (按下時加入 class:touching，放開時移除) */
Vue.directive('touching', {
	bind: function (el, binding, vnode) {
		el.addEventListener('touchstart', function(e) {
			el.touchingTarget = binding.value ? e.srcElement.closest(binding.value) : el;
			if (el.touchingTarget && el.touchingTarget.classList)
				el.touchingTarget.classList.add('touching');
		});
		el.addEventListener('touchmove', function(e) {
			if (el.touchingTarget && el.touchingTarget.classList)
				el.touchingTarget.classList.remove('touching');
		});
		el.addEventListener('touchend', function(e) {
			if (el.touchingTarget && el.touchingTarget.classList)
				el.touchingTarget.classList.remove('touching');
		});
	}
})
/** v-touching-end : 在 touchend 才加入點擊中效果 (加入 class:touching 200ms 後移除) */
Vue.directive('touching-end', {
	bind: function (el, binding, vnode) {
		el.addEventListener('touchstart', function(e) {
			el = el || e.currentTarget;
			el.startFlag = true;
			let touch0 = event.targetTouches[0];
			el.startX = touch0.pageX;
			el.startY = touch0.pageY;
		});
		el.addEventListener('touchmove', function(e) {
			el = el || e.currentTarget;
			delete el.startFlag;
		});
		el.addEventListener('touchend', function(e) {
			el = el || e.currentTarget;
			if (el.startFlag) {
				delete el.startFlag;
				let touch0 = e.changedTouches[0];
				let diffXY = Math.abs(touch0.pageX - el.startX) + Math.abs(touch0.pageY - el.startY);
				if (diffXY > 10)
					return;

				let targetEl;
				if (binding.value) {
					targetEl = e.srcElement.closest(binding.value);
				}
				if (targetEl && targetEl.classList) {
					targetEl.classList.add('touching');
					setTimeout((targetEl)=>{
						targetEl.classList.remove('touching');
					}, 200, targetEl);
				}
			}
		});
	}
})

// touchstart / touchmove / touchend 一律停止冒泡
Vue.directive('stop-propagation', {
	bind: function (el) {
		el.addEventListener('touchstart', function() {
			event.stopPropagation();
		});
		el.addEventListener('touchmove', function() {
			event.stopPropagation();
		});
		el.addEventListener('touchend', function() {
			event.stopPropagation();
		});
	}
})
// 僅 touchmove 停止冒泡
Vue.directive('stop-propagation-touchmove', {
	bind: function (el) {
		el.addEventListener('touchmove', function() {
			event.stopPropagation();
		});
	}
})

function sideStopPropagation(el, xy) {
	el.addEventListener('touchstart', function() {
		let touch0 = event.targetTouches[0];
		this.startX = touch0.pageX;
		this.startY = touch0.pageY;
	});
	el.addEventListener('touchmove', function() {
		let touch0 = event.targetTouches[0];
		if (this.moveSide == xy) {
			event.stopPropagation();
			return;
		}
		// 侦测方向
		if (!this.moveSide) {
			if (Math.abs(this.startY - touch0.pageY) >= 10) {
				// console.log("moveSide : Y");
				this.moveSide = 'Y';
				if (xy === 'Y')
					event.stopPropagation();
				return;
			}
			if (Math.abs(this.startX - touch0.pageX) >= 10) {
				// console.log("moveSide : X");
				this.moveSide = 'X';
				if (xy === 'X')
					event.stopPropagation();
				return;
			}
		}
	});
	el.addEventListener('touchend', function() {
		delete this.moveSide;
	});
}
// X 向移動確認後，停止冒泡
Vue.directive('stop-propagation-x', {
	bind: function (el) {
		sideStopPropagation(el, 'X');
	}
})
// Y 向移動確認後，停止冒泡
Vue.directive('stop-propagation-y', {
	bind: function (el) {
		sideStopPropagation(el, 'Y');
	}
})
// 長按 (498ms) 回呼與遮罩
Vue.directive('press', {
	bind: function (el, binding, vnode) {
		el.addEventListener('touchstart', function(event) {
			if (event.targetTouches.length > 1) {
				clearTimeout(this.pressTimeout);
				delete this.pressTimeout;
				return;
			}
			let touch0 = event.targetTouches[0];
			this.startX = touch0.pageX;
			this.startY = touch0.pageY;
			this.pressTimeout = setTimeout(()=>{
				// 利用 floatDialogStopEvent 來產生一個遮檔事件的遮罩 (避免 touchEnd 時觸發到 floatDialog 裡面的內容)
				vnode.context.$store.state.sync.floatDialogStopEvent = true;
				if (binding.value)
					binding.value(event);
			}, 498);
		});
		el.addEventListener('touchmove', function() {
			if (!this.pressTimeout)
				return;
			let touch0 = event.targetTouches[0];
			if (Math.abs(this.startX - touch0.pageX) >= 5 || Math.abs(this.startY - touch0.pageY) >= 5) {
				clearTimeout(this.pressTimeout);
				delete this.pressTimeout;
			}
		});
		el.addEventListener('touchend', function() {
			clearTimeout(this.pressTimeout);
			delete this.pressTimeout;
			// 利用 floatDialogStopEvent 來產生一個遮檔事件的遮罩 (避免 touchEnd 時觸發到 floatDialog 裡面的內容)
			setTimeout(()=>{
				vnode.context.$store.state.sync.floatDialogStopEvent = false;
			}, 300);

		});
	}
})
// 長按連續回呼功能
Vue.directive('long-press', {
	bind: function (el, binding, vnode) {
		if (!binding.value)
			return;
		let trigger = (thisDelay)=>{
			el.triggerTimout = setTimeout(()=>{
				let nextDelay = thisDelay - 75;
				nextDelay = nextDelay > 50 ? nextDelay : 50;
				binding.value(event);
				trigger(nextDelay);
			}, thisDelay);
		};
		el.addEventListener('touchstart', function(event) {
			trigger(500);
		});
		el.addEventListener('touchend', function() {
			clearTimeout(el.triggerTimout);
		});
	}
})
