export default {
	data: function () {
		return {
            ratioWidth: 1,
			ratioHeight: 1,
            gridSetting: {
				'grid_y': 4,
				'gridColor': '#333',
			},
		}
	},
    created() {
		this.$nextTick(() => {
			this.canvas = this.$refs.canvas || this.$refs.gridCanvas;
			this.resizeCanvas();
		});
	},
	mounted() {
	},
	methods: {
		// 同步畫布尺寸
		resizeCanvas() {
			const { lineCanvasCtn } = this.$refs;
			if (!lineCanvasCtn)
				return;
			
			let ratio = this.ratio = this.$store.state.device.ratio;
			// 取得畫布尺寸
			let width = lineCanvasCtn.clientWidth;
			let height = lineCanvasCtn.clientHeight;
			// 轉向過程可能拿到 height=0 的情況，應略過不處理
			if (width && height) {
				this.canvasWidth = width;
				this.canvasHeight = height;
				this.ratioWidth = this.$safeFloat(width * ratio);
				this.ratioHeight = this.$safeFloat(height * ratio);
				this.canvas.style.width = width + 'px';
				this.canvas.style.height = height + 'px';
			}
		},
		// 清除畫布
		clearCanvas() {
			this.$refs.canvas.getContext('2d').clearRect(0, 0, this.ratioWidth, this.ratioHeight);
		},
		// 取得指定價格在圖上的高度
        getPricePosition(price, skyPrice, groundPrice, useCanvasHeight) {
			// if(!this.canvas) return 0;
            // 有帶 useCanvasHeight 時表示高度要使用 canvas.height (canvas.height 因支援高解析度，會受 ratio 影響)
            const canvasHeight = useCanvasHeight ? this.canvas.height : (this.canvasHeight || this.canvas.height);
            const priceRange = skyPrice - groundPrice;
            // 價格差     位置
            // ------ = --------
            // 總價格    總高度
            const position = (skyPrice - price) / priceRange * canvasHeight;
            return Math.round(position);
		},		
		// 畫格線
        drawGrid: function(canvas, gridCnt) {
			if (!canvas) return;
            // 取得畫筆
            const ctx = canvas.getContext('2d');
            // 格線顏色
			ctx.strokeStyle = this.gridSetting.gridColor;
			// 格線寬度
			ctx.lineWidth = 1 * this.ratio;	
            // 清除畫布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 位移 0.5，讓系統決定畫在哪個 pixel上
            ctx.translate(0.5, 0.5);
            // 開始路徑
			ctx.beginPath();
			// 點線
			ctx.setLineDash([1,1]);
            // 每一格的寬度與高度
            const perHeight = canvas.height / gridCnt;

            // Y 軸線
            for (let y = 1; y < gridCnt; y++) {
                const offsetY = Math.round(perHeight * y);
                ctx.moveTo(0, offsetY);
                ctx.lineTo(canvas.width, offsetY);
            }
            ctx.stroke();
            // 位移回來，不然畫面會一直往右下角偏
            ctx.translate(-0.5, -0.5);
		},
	},
}
