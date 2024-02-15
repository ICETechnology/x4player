<template>
	<div class="paint-wrap flex-center" >
		<div class="paint-ctn flex-col">
			<div class="paint-head bgc-gray flex-end" v-if="!isDesktop"><i class="material-icons md-24 mgr1 clr-up"  @click="onClose">close</i></div>
			<div class="paint-body bgc-black flex-1" :class="isDesktop? 'flex-col col-reverse': 'flex-row'">
				<div class="flex-col flex-1 posr">
					<div class="FULL flex-col overflow-auto" ref="canvasWrap" v-stop-propagation @mousedown="onPanStart" @mouseup="onPanEnd" @mousemove="onPanMove"
						@touchstart="onPaintStart" @touchend="onPaintEnd" @touchmove="onPaintMove">
						<canvas ref="paintCanvas" :width="paint_width" :height="paint_height" class="paint-canvas" />
					</div>
				</div>
				<div class="paint-tools" :class="isDesktop? 'flex-row': 'flex-col'">
					<span class="icon-btn mgtb1" :class="{'mgl2': isDesktop}">
						<i class="material-icons" @click="isPaint = !isPaint" :class="{'clr-orange2': isPaint}" >create</i>
					</span>
					<span class="icon-btn mgtb1" :class="{'mgl2': isDesktop}">
						<i class="material-icons" @click="onRestore" >reply</i>
					</span>
					<span class="icon-btn mgtb1" :class="{'mgl2': isDesktop}">
						<i class="material-icons" @click="onSave" >save</i>
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {
			line_color: 'red',
			line_width: 5,
			paint_width: 0,
			paint_height: 0,
			base_image: {},
			isPaint: false,
			painting: false,
			ratio: 1,
		}
	},
	props:['value', 'param'],
	beforeMount() {
		if(this.isDesktop){
			this.$emit('title', '图形编辑');
			this.$emit('dialogClass', `dialog-size-big`);
		}
		// 有帶背景圖片
		if(this.graphicData) {
			let self = this;
			this.base_image = new Image();
			this.base_image.src = this.graphicData;
			// 設定canvas寬高
			this.base_image.onload = function(){
				self.paint_width = this.width;
				self.paint_height = this.height;
			}
		}
	},
	mounted() {
		this.canvas = this.$refs.paintCanvas;
		let context = this.canvas.getContext('2d');
		let backingStore = context.backingStorePixelRatio ||
					context.webkitBackingStorePixelRatio ||
					context.mozBackingStorePixelRatio ||
					context.msBackingStorePixelRatio ||
					context.oBackingStorePixelRatio ||
					context.backingStorePixelRatio || 1;
		this.ratio =  (window.devicePixelRatio || 1) / backingStore;
		console.log(`PaintRatio`, this.ratio);
		
		// 有帶背景圖片
		if(this.graphicData) {
			let self = this;
			this.context = this.canvas.getContext('2d');
			// 延遲畫背景圖片(需等寬高設定好)
			setTimeout(() => {
				let canvasWrap = this.$refs.canvasWrap;
				// self.canvas.style = `width: ${canvasWrap.offsetWidth}px; height: ${canvasWrap.offsetHeight}px;`;
				console.log(`canvasWrap.offsetWidth:`, canvasWrap.offsetWidth, "canvasWrap.offsetHeight", canvasWrap.offsetHeight);
				// 為處理紅米6在取canvas wrap寬、高時異常暫時的做法。(24是功能鍵寬及close高)
				let _height = this.$safeFloat(this.$store.state.device.height * 0.85 - 24);
				let _width = this.$safeFloat(this.$store.state.device.width * 0.85 - 24);
				self.canvas.style = `width: ${_width}px; height: ${_height}px;`;
				self.context.drawImage(self.base_image, 0, 0);
			}, 100);
		}
	},
	methods: {
		onClose(){
			this.$emit('CLOSEPAINT');
		},
		onRestore() {
			this.context.drawImage(this.base_image, 0, 0);
			this.$store.state.notify(this.$ln('已回复初始画面'));
		},
		onSave() {
			// 桌機版透過call back處理存儲
			if(this.isDesktop)
				this.param.save(this.canvas.toDataURL());
			// app 以v-model方式處理存儲
			else
				this.$emit('input', this.canvas.toDataURL());
			this.$store.state.notify(this.$ln('已储存绘图'));
		},
		onPanStart(e) { 
            if(!e.targetTouches) e.targetTouches = [e];
			this.touchActive = true;
			this.onPaintStart(e);
        },
        onPanEnd(e){
			if(!this.touchActive) return;
            if(!e.targetTouches) e.targetTouches = [e];
			this.touchActive = false;
			this.onPaintEnd(e);
        },
        onPanMove(e){
			if(!this.touchActive) return;
			if(!e.targetTouches) e.targetTouches = [e];
			this.onPaintMove(e);
        },
		onPaintStart(event) {
			if(this.isPaint) {
				let touch0 = event.targetTouches[0];
				let touch0X = touch0.pageX;
				let touch0Y = touch0.pageY;
				let posX = this.$safeFloat(this.paint_width * ((touch0X - touch0.target.getBoundingClientRect().left) / touch0.target.clientWidth));
				let posY = this.$safeFloat(this.paint_height * ((touch0Y - touch0.target.getBoundingClientRect().top) / touch0.target.clientHeight));
				this.context.lineWidth = this.line_width;
				this.context.strokeStyle = this.line_color;
				this.context.beginPath();
				this.context.moveTo(posX, posY);
				this.painting = true;
			}
		},
		onPaintEnd(event) {
			if(this.isPaint && this.painting) {
				this.painting = false;
			}
		},
		onPaintMove(event) {
			if(this.isPaint && this.painting) {
				let touch0 = event.targetTouches[0];
				let touch0X = touch0.pageX;
				let touch0Y = touch0.pageY;
				let posX = this.$safeFloat(this.paint_width * ((touch0X - touch0.target.getBoundingClientRect().left) / touch0.target.clientWidth));
				let posY = this.$safeFloat(this.paint_height * ((touch0Y - touch0.target.getBoundingClientRect().top) / touch0.target.clientHeight));
				this.context.lineTo(posX, posY);
				this.context.stroke()
			}
		},
	},
	computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 圖片資料
		graphicData() {
			// 桌機版以param方式傳要編輯的圖片
			if(this.isDesktop)	return this.param.value;
			// app以v-model資料編輯圖片
			else return this.value;
		},
	},
	watch: {
		isPaint(nv){
			if(nv) 
				this.$store.state.notify(this.$ln('启用画线功能'));
			else 
				this.$store.state.notify(this.$ln('关闭画线功能'));
		}
	}
}
</script>
<style scoped>
.paint-wrap {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	margin: auto;
}
.paint-ctn {
	width: 85%;
	height: 85%;
	border: 1px gray solid;
}
.col-reverse {
	flex-flow: column-reverse;
}
.paint-canvas{
	width: 100%;
	height: 100%;
}
.desktop .paint-wrap {
	position: absolute;
}
.desktop .paint-ctn {
	width: 100%;
	height: 100%;
}
</style>