<template>
	<div class="audio-ctn">
		<audio ref="order_Effect" preload="auto" />
		<audio ref="fllow_Effect" preload="auto" />
		<audio ref="data_Effect" preload="auto" />
		<audio ref="demo_Effect" preload="auto" />
	</div>
</template>
<script>
export default {
	data(){
		return{
			bgMusic: window.cloudPath + "/soundEffect/mute.mp3",
			volume: 0.5,
			playPromise: {},
		}
	},
	beforeMount() {
		let self = this;
		// 收到即時委託成功
		eventBus.$on("RECEIVE-REALTIME-SUCCESS", (rpt)=>{
			// 是回報才播
			if(rpt)
				self.audioPlay('order');
		});		
		// 收到即時成交
		eventBus.$on("RECEIVE-REALTIME-FILLED", (rpt)=>{
			// 是回報才播
			if(rpt)
				self.audioPlay('report_filled');
		});
		// 收到即時委託失敗
		eventBus.$on("RECEIVE-REALTIME-FAILED", (rpt)=>{
			// 是回報才播
			if(rpt)
				self.audioPlay('report_error');
		});

		// 發送委託
		eventBus.$on("SEND-ORDER", (rpt)=>{
			self.fllowEffectPlay('sendOrder');
		});
		// 彈出視窗
		eventBus.$on("DIALOG-ACTIVE", ()=>{
			self.fllowEffectPlay('popupDialog');
		});
		// 關閉視窗
		eventBus.$on("DIALOG-DESTORY", ()=>{
			self.fllowEffectPlay('closeDialog');
		});
		// 確認視窗
		eventBus.$on("CONFIRM-DIALOG", ()=>{
			self.fllowEffectPlay('popupDialog');
		});
		// 關閉確認視窗
		eventBus.$on("CLOSE-CONFIRM", ()=>{
			self.fllowEffectPlay('closeDialog');
		});
		// 彈出視窗
		eventBus.$on("POPUP-FLOAT-DIALOG", ()=>{
			self.fllowEffectPlay('popupDialog');
		});
		// 關閉彈出視窗
		eventBus.$on("CLOSE-FLOAT-DIALOG", ()=>{
			self.fllowEffectPlay('closeDialog');
		});
		// 切換頁簽
		eventBus.$on("TAB-ACTIVE", ()=>{
			self.fllowEffectPlay('switchTab');
		});
		// 切換版面
		eventBus.$on("SWITCH-PAGE", ()=>{
			self.fllowEffectPlay('switchPage');
		});
		// 啟動完成
		eventBus.$on("START-COMPLETE", ()=>{
			// self.fllowEffectPlay('startComplete');
		});
		// 功能列展開
		eventBus.$on("EXPAND", ()=>{
			self.fllowEffectPlay('expand');
		});
		// scrollBounce 下拉重查
		eventBus.$on("REFRESH", ()=>{
			self.fllowEffectPlay('reloadData');
		});
		// 滑入側邊選單。
		eventBus.$on("SLIDEINMENU", ()=>{
			self.fllowEffectPlay('slideInMenu');
		});
		// 滑出側邊選單。
		eventBus.$on("SLIDEOUTMENU", ()=>{
			self.fllowEffectPlay('slideOutMenu');
		});
		// 重查成功
		eventBus.$on("QUERYDONE", ()=>{
			self.dataEffectPlay('queryResult_done');
		});
		// 重查失敗
		eventBus.$on("QUERYFAIL", ()=>{
			self.dataEffectPlay('queryResult_fail');
		});
		// 重查無資料
		eventBus.$on("QUERYNODATA", ()=>{
			self.dataEffectPlay('queryResult_noData');
		});
		// 輸入改變
		eventBus.$on("IPTCHANGE", ()=>{
			self.dataEffectPlay('iptChange');
		});
		// 新TICK資料。
		eventBus.$on("NEWTICK", ()=>{
			self.dataEffectPlay('rtTick');
		});
		// 資料選取
		eventBus.$on("SWITCHDATA", ()=>{
			self.dataEffectPlay('switchData');
		});
		// DEMO聲音。
		eventBus.$on("DEMOEFFECT", (obj)=>{
			self.demoEffectPlay(obj.src);
		});
	},
	mounted() {
		this.order_Effect = this.$refs.order_Effect
		this.fllow_Effect = this.$refs.fllow_Effect;
		this.data_Effect = this.$refs.data_Effect;
		this.demo_Effect = this.$refs.demo_Effect;
	},
	methods: {
		// 回報音效
		audioPlay(type){			
			// 音效名稱
			let effectName = this.$store.state.config.advanceEffectSetting[type];
			// 音效路徑
			let effectUrl = `${window.cloudPath}/soundEffect/${effectName}.mp3`;
			//判斷系統設定音效開關
			if(!this.$store.state.config.soundEffect || effectName == "mute") return;
			this.order_Effect.volume = this.volume;	
			if(window.firstInteractive)
				this.playEffect("order_Effect", effectUrl);
		},
		/**由於音效的播放需要與使用者互動才能播放，所以載入後的背景音、回報音效都透過window.firstInteractive來判斷是否播放。
		 * 動線音效必與使用者互動所以另外在初始互動時延遲10ms播放;
		 */
		// 動線音效
		fllowEffectPlay(type){
			// 音效名稱
			let effectName = this.$store.state.config.advanceEffectSetting[type];
			// 音效路徑
			let effectUrl = `${window.cloudPath}/soundEffect/${effectName}.mp3`;
			// 判斷系統設定音效開關
			if(!this.$store.state.config.fllowEffect || effectName == "mute") return;
			// 震動
			// window.navigator.vibrate(300);
			this.fllow_Effect.volume = this.volume;
			// 初始互動時延遲10ms播放
			if(!window.firstInteractive) {
				let self = this;
				setTimeout(()=>{
					if(window.firstInteractive)
						self.playEffect("fllow_Effect", effectUrl);
				}, 10)
			}
			else
				this.playEffect("fllow_Effect", effectUrl);
		},
		// 資料音效
		dataEffectPlay(type){
			// 音效名稱
			let effectName = this.$store.state.config.advanceEffectSetting[type];
			// 音效路徑
			let effectUrl = `${window.cloudPath}/soundEffect/${effectName}.mp3`;
			//判斷系統設定音效開關
			if(!this.$store.state.config.dataEffect || effectName == "mute") return;
			this.data_Effect.volume = this.volume;
			this.playEffect("data_Effect", effectUrl);
		},
		// demo音效
		demoEffectPlay(effectName){
			// 音效路徑
			let effectUrl = `${window.cloudPath}/soundEffect/${effectName}.mp3`;
			this.demo_Effect.volume = this.volume;
			this.playEffect("demo_Effect", effectUrl);
		},
		// 停止音效
		stopEffect(type){
			if(this.playPromise[type] != undefined){
				let self = this;
				this.playPromise[type].then( ()=> {
					self[type].pause();
					self[type].currentTime = 0;
				}).catch(error => {
					console.warn("audio pause error", error);
				});
			}
		},
		// 播放音效
		playEffect(type, effectUrl){
			if(!window.firstInteractive) return;
			this.stopEffect(type);
			try{
				let self = this;
				// 音效來源
				this[type].src = effectUrl;
				// 給10ms是為了避免透過程式播放時，同時間有兩個音效要播而產生的source衝突。
				setTimeout(() => {
					self.playPromise[type] = self[type].play();	
				}, 1);
			}catch(e){
				console.warn(`sound effect play error by type is ${type} and source is ${effectUrl}.`)
			}
		},
	}
}
</script>
<style scoped>
.audio-ctn{
	width: 0;
	height: 0;
}
</style>