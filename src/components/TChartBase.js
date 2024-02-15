export default {
	data: function () {
		return {
		}
	},
	mounted() {
	},
	beforeDestroy() {
		this.$refs.gridCanvas1 = null;
		if(this.$refs.gridCanvas2)
			this.$refs.gridCanvas2 = null;
	},
	methods: {
		getRatio() {
			let ratio = 1;
			let context = this.canvas1.getContext('2d');
			let backingStore = context.backingStorePixelRatio ||
						context.webkitBackingStorePixelRatio ||
						context.mozBackingStorePixelRatio ||
						context.msBackingStorePixelRatio ||
						context.oBackingStorePixelRatio ||
						context.backingStorePixelRatio || 1;
			return (window.devicePixelRatio || 1) / backingStore;
		},
		// 同步畫布尺寸
		resizeCanvas() {
			let self = this;
			let ratio = this.ratio = this.ratio || this.getRatio();
			// 取得畫布尺寸
			let width = this.$refs.lineCanvasCtn1.clientWidth;
			let height1 = this.$refs.lineCanvasCtn1.clientHeight;
			
			// 轉向過程可能拿到 height=0 的情況，應略過不處理
			if (width && height1) {
				this.canvasWidth = width;
				this.canvasHeight1 = height1;
				// this.canvasHeight2 = height2;
				this.ratioWidth = width * ratio;
				this.ratioHeight1 = height1 * ratio;
				// this.ratioHeight2 = height2 * ratio;
				this.canvas1.style.width = width + 'px';
				this.canvas1.style.height = height1 + 'px';
				// this.canvas2.style.width = width + 'px';
				// this.canvas2.style.height = height2 + 'px';
			}
			if (width && this.$refs.lineCanvasCtn2) {
				let height2 = this.$refs.lineCanvasCtn2.clientHeight;
				this.canvasHeight2 = height2;
				this.ratioHeight2 = height2 * ratio;
				this.canvas2.style.width = width + 'px';
				this.canvas2.style.height = height2 + 'px';
			}
			setTimeout(()=>{
				self.drawGrid(self.$refs.gridCanvas1, 4);
				if(self.$refs.gridCanvas2)
					self.drawGrid(self.$refs.gridCanvas2, 2);
			}, 50);
		},
		// 清除畫布
		clearCanvas() {
			if(!this.$refs.canvas1) return;
			this.$refs.canvas1.getContext('2d').clearRect(0, 0, this.ratioWidth, this.ratioHeight1);
			if(this.$refs.canvas2)
				this.$refs.canvas2.getContext('2d').clearRect(0, 0, this.ratioWidth, this.ratioHeight2);
		},
		// 畫格線
        drawGrid: function(canvas, gridCnt) {
			if (!canvas) return;
			let self = this;
            // 取得畫筆
            let ctx = canvas.getContext('2d');
            // 格線顏色
            ctx.strokeStyle = self.gridSetting.gridColor;
            // 清除畫布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 位移 0.5，讓系統決定畫在哪個 pixel上
            ctx.translate(0.5, 0.5);
            // 開始路徑
			ctx.beginPath();
			// 點線
			ctx.setLineDash([1,1]);
            // 每一格的寬度與高度
            let perHeight = canvas.height / gridCnt;
            // Y 軸線
            for (let y = 1; y < gridCnt; y++) {
                let offsetY = Math.round(perHeight * y);
                ctx.moveTo(0, offsetY);
                ctx.lineTo(canvas.width, offsetY);
            }
            ctx.stroke();
            // 位移回來，不然畫面會一直往右下角偏
            ctx.translate(-0.5, -0.5);
		},		
		// hhmmToTimeKey('20190620', '0600', '0600') -> '201906200600'
		// hhmmToTimeKey('20190620', '0600', '0500') -> '201906210500'
		hhmmToTimeKey(d8, firstStartTime, t) {
			let self = this;
			// 比第一盤的時間小 -> 跨日
			let td = t < firstStartTime ? (parseInt(d8) + 1) : d8;
			return `${td}${t}`;
		},
		// '201906200601' -> Date
		timeKeyToDate(s) {
			let d = new Date();
			d.setFullYear(s.substr(0,4));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setDate(s.substr(6,2));
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			return d;
		},
		// Date -> '201906200601'
		dateToTimeKey(d) {
			return d.getFullYear() + 
				("0" + (d.getMonth()+1)).slice(-2) +
				("0" + d.getDate()).slice(-2) +
				("0" + d.getHours()).slice(-2) + 
				("0" + d.getMinutes()).slice(-2);
		},
		// '201906200601' -> '2019/06/20 06:01'
		timeKeyToDisplayTime(s) {
			return `${s.substr(4,2)}/${s.substr(6,2)} ${s.substr(8,2)}:${s.substr(10,2)}`;
		},
		// tick object -> '2019/06/20 06:01'
		tickToDisplayTime(o) {
			let timeKey = '' + o.d + (o.t/100000).toString().addZero(4);
			return this.timeKeyToDisplayTime(timeKey);
		},
		// '201906270000' -> '0627'
		timeKeyToTimeLabel(timeKey) {
			return timeKey.substr(4,4);
		},
	}
}