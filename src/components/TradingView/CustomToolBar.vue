<template>
	<div class="custom-tool-bar hidden">
	</div>
</template>

<script>
import IndicatorSelector from '@/components/TradingView/IndicatorSelector.vue';

export default {
	props: ['widget'],
	data: function () {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
	},
	methods: {
		customToolBar() {
			console.log('[TVC] customToolBar()');
			let btn;
			let widget = this.widget;
			// 技術指標選擇器
			btn = widget.createButton({align: "left"});
			btn.classList.add('custom-button');
			btn.setAttribute("title", this.$tvc.locale==='zh' ? '指标或策略' : '指標或策略');
			let txt = btn.textContent = this.$tvc.locale==='zh' ? `技术指标` : `技術指標`;
			btn.onclick = () => {
				eventBus.$emit("POPUP-DIALOG", IndicatorSelector, {addIndicator: (idcID)=>{
					this.$emit('addIndicator', idcID);
				}}, {$HEAD: {title: txt}, transName: 'float'});
			};

			// 有啟用交易功能時 -> 出現切換要不要顯示的按鈕
			if (this.enableTrade) {
				btn = widget.createButton({align: "right"});
				btn.classList.add('custom-button');
				btn.innerHTML = this.$tvc.icon.save;
				btn.onclick = () => {
					this.$emit('toggleTrade');
				};
			}

			// 恢復預設狀態
			this.restoreBtn = btn = widget.createButton({align: "right"});
			btn.classList.add('custom-button');
			btn.innerHTML = this.$tvc.icon.restore;
			btn.setAttribute("title", this.$tvc.locale==='zh' ? '恢复预设' : '恢復預設');
			btn.onclick = () => {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: this.$tvc.locale==='zh' ? `恢复预设` : `恢復預設`,
					content: this.$tvc.locale==='zh' ? `将所有设定与指标恢复至出厂预设 ?` : `將所有設定與指標恢復至出廠預設 ?`,
					confirm: ()=>{
						setTimeout(()=>{
							eventBus.$emit("CONFIRM-DIALOG", {
								title: this.$tvc.locale==='zh' ? `恢复预设` : `恢復預設`,
								content: this.$tvc.locale==='zh' ? `再次确认将所有设定与指标恢复至出厂预设 ?` : `再次確認將所有設定與指標恢復至出廠預設 ?`,
								confirm: ()=>{
									this.$emit('restore');
								}
							});
						}, 100);
					}
				});
			};
			// 分母值 (繁简同字不用转)
			btn = this.pricescaleBtn = widget.createButton({align: "left"});	
			btn.classList.add('custom-button');
			btn.setAttribute("title", `分母值`);
			btn.innerHTML = `
				<div class="flex-col">
					<div style="color: gray; font-size: 10px;">分母值</div>
					<div class="flex-center pricescale-value">${this.pricescale}</div>
				</div>
			`;
			this.pricescaleBtn.parentNode.parentNode.style.display = this.pricescale?'':'none';
		},
	},
	watch: {
		pricescale(nv) {
			try {
				this.pricescaleBtn.parentNode.parentNode.style.display = nv?'':'none';
				this.pricescaleBtn.querySelector('.pricescale-value').innerText = nv || '';
			}catch(e){}
		},		
	},
	computed: {
		// tvc變數容器
		$tvc() {
			return this.$store.state.tvc;
		},
		// 使用的分母值
		pricescale() {
			return this.$tvc.pricescaleMap[this.$tvc.sid];
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		defaultState() {
			try{return JSON.parse(Base64.decode(this.publicPdSetting.defaultState));}catch(e){}
		},
		// 啟用交易功能
		enableTrade() {
			try{return this.publicPdSetting.CONFIG.TVC.enableTrade;}catch(e){}
		},
	}
}
</script>
