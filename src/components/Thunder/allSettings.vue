<template>
	<div class="thunder-setting-ctn flex-col flex-1 divider-top mgt2 pdt2" v-stop-propagation-y>
		<!-- <MyHead class="head" :backType="1" showText="闪电设定"></MyHead> -->
		<!-- 進場 -->
		<div class="overflow-y-auto enter-ctn flex-col flex-1 posr" v-if="param=='enter'">
			<scrollBounce>				
				<div class="font-size-big bgc-black mg3 rd1 pd4 flex-row flex-center" >
					{{$ln('委託別設定')}}
					<div class="flex-1" ></div>
					<radio v-model="enter.positionEffect" class="flex-row radio-ctn">
						<div value="AUTO" class="mgr5" >
							<div class="circle-around flex-center mgtb2 mgr2"><div class="circle-focus" v-if="enter.positionEffect=='AUTO'"></div></div>
							{{$ln('自動')}}
						</div>
						<div value="NEW" class="mgl5" >
							<div class="circle-around flex-center mgtb2 mgr2"><div class="circle-focus" v-if="enter.positionEffect=='NEW'"></div></div>
							{{$ln('新倉')}}
						</div>					
					</radio>
				</div>

				<div class="setting-head font-size-large flex-row pd3">
					<span class="circle flex-center bgc-E03434 w20vw mgr2">S</span>
					<span class="flex-1">{{$ln('停损限价')}}</span>
				</div>
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col">
						<span class="pdb2 flex-wrap">
							{{$ln('下单时，依据点选停损价加挂')}}
							<inputQty v-model="enter.stopOrderTicksize" noBtn=true class="w20vw" />{{$ln('档，送出停损限价委托。')}}
						</span>
					</span>
				</div>
				<div class="divider-bottom" />
				<div class="setting-head font-size-large flex-row pd3">
					<span class="circle flex-center bgc-1B31AB w20vw mgr2">T</span>
					<span class="flex-1">{{$ln('触价下单')}}</span>
				</div>
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col">
						<span class="pdb2">{{$ln('下单时，依据点选价格送出触价单，触价时以：')}}</span>
						<radio v-model="enter.touchOrderType" class="flex-col radio-ctn">
							<div value="MIT"><div class="circle-around flex-center mgtb2 mgr2"><div class="circle-focus" v-if="enter.touchOrderType=='MIT'"></div></div>
								{{$ln('市价/一定范围市价送出委托。')}}</div>
							<div value="LIT"><div class="circle-around flex-center mgr2"><div class="circle-focus" v-if="enter.touchOrderType=='LIT'"></div></div>
								{{$ln('限价加挂')}}<inputQty v-model="enter.touchOrderTicksize" noBtn=true class="w20vw" />{{$ln('档，送出委托。')}}</div>
						</radio>
					</span>
				</div>
				<div class="divider-bottom" />
				<div class="setting-head font-size-large flex-row pd3">
					<span class="circle flex-center bgc-6C266F w20vw mgr2">O</span>
					<span class="flex-1">{{$ln('OCO委托')}}</span>
				</div>
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col">
						<span class="pdb2">{{$ln('下单时，任意点选两个价位之量区挂出OCO触价单，触价时以：')}}</span>
						<radio v-model="enter.ocoOrderType" class="flex-col radio-ctn">
							<div value="MIT"><div class="circle-around flex-center  mgtb2 mgr2"><div class="circle-focus" v-if="enter.ocoOrderType=='MIT'"></div></div>
							{{$ln('市价/一定范围市价送出委托。')}}</div>
							<div value="LIT"><div class="circle-around flex-center mgr2"><div class="circle-focus" v-if="enter.ocoOrderType=='LIT'"></div></div>
								{{$ln('限价加挂')}}<inputQty v-model="enter.ocoOrderTicksize" noBtn=true class="w20vw" />{{$ln('档，送出委托。')}}</div>
						</radio>
					</span>
				</div>
				<div class="divider-bottom" />
				<!-- <div class="setting-head font-size-large flex-row pd3">
					<span class="circle flex-center bgc-5756D7 w20vw mgr2">BK</span>
					<span class="flex-1">{{$ln('突破策略')}}</span>
				</div>
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col pdtb2">
						<span class="pdb2">{{$ln('触价时，以')}}</span>
						<radio v-model="enter.bkOrderType" class="flex-col radio-ctn">
							<div value="MARKET"><div class="circle-around flex-center"><div class="circle-focus" v-if="enter.bkOrderType=='MARKET'"></div></div>{{$ln('〖市价〗送出委托。')}}</div>
							<div value="LIMIT"><div class="circle-around flex-center"><div class="circle-focus" v-if="enter.bkOrderType=='LIMIT'"></div></div>
								{{$ln('〖限价〗加')}}<inputQty v-model="enter.bkOrderTicksize" noBtn=true class="w20vw" />{{$ln('档，送出委托。')}}</div>
						</radio>
					</span>
				</div>
				<div class="divider-bottom" /> -->
			</scrollBounce>
		</div>
		<!-- 出場 -->
		<div class="overflow-y-auto outer-ctn flex-col flex-1 posr" v-if="param=='outer'">
			<scrollBounce>
				<div class="font-size-big bgc-black mg3 rd1 pd4 flex-row flex-center" >
					{{$ln('委託別設定')}}
					<div class="flex-1" ></div>
					<radio v-model="outer.positionEffect" class="flex-row radio-ctn">
						<div value="AUTO" class="mgr5" >
							<div class="circle-around flex-center mgtb2 mgr2"><div class="circle-focus" v-if="outer.positionEffect=='AUTO'"></div></div>
							{{$ln('自動')}}
						</div>
						<div value="CLOSE" class="mgl5" >
							<div class="circle-around flex-center mgtb2 mgr2"><div class="circle-focus" v-if="outer.positionEffect=='CLOSE'"></div></div>
							{{$ln('平倉')}}
						</div>					
					</radio>
				</div>
				<div class="setting-head font-size-large flex-row pdt2">
					<span class="circle flex-center bgc-19B61D w20vw mgr2">SP</span>
					<span class="flex-1">{{$ln('停利SP')}}</span>
				</div>
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col">
						<div class="flex-row flex-vertical-center flex-wrap">{{$ln('依据实际成交价格获利')}}<inputQty v-model="outer.protectSPTicksize" noBtn=true class="w20vw" />
						{{$ln('档，送出停利触价单，触价时以：')}}</div>
						<radio v-model="outer.protectSPType" class="flex-col radio-ctn">
							<div value="MIT"><div class="circle-around flex-center  mgtb2 mgr2"><div class="circle-focus" v-if="outer.protectSPType=='MIT'"></div></div>
							{{$ln('市价/一定范围市价送出委托。')}}</div>
							<div value="LIT"><div class="circle-around flex-center mgr2"><div class="circle-focus" v-if="outer.protectSPType=='LIT'"></div></div>
								{{$ln('限价加挂')}}<inputQty v-model="outer.spSmoTicksize" noBtn=true class="w20vw" />{{$ln('档，送出委托。')}}</div>
						</radio>
					</span>
				</div>
				<div class="divider-bottom" />
				<div class="setting-head font-size-large flex-row pdt2">
					<span class="circle flex-center bgc-B61616 w20vw mgr2">SL</span>
					<span class="flex-1">{{$ln('停损SL')}}</span>
				</div>
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col pdtb2">
						<div class="flex-row flex-vertical-center flex-wrap">{{$ln('依据实际成交价格損失')}}<inputQty v-model="outer.protectSLTicksize" noBtn=true class="w20vw" />
						{{$ln('档，送出停損触价单，触价时以：')}}</div>
						<radio v-model="outer.protectSLType" class="flex-col radio-ctn">
							<div value="STOP"><div class="circle-around flex-center  mgtb2 mgr2"><div class="circle-focus" v-if="outer.protectSLType=='STOP'"></div></div>
							{{$ln('市价/一定范围市价送出委托。')}}</div>
							<div value="STPLMT"><div class="circle-around flex-center mgr2"><div class="circle-focus" v-if="outer.protectSLType=='STPLMT'"></div></div>
								{{$ln('限价加挂')}}<inputQty v-model="outer.slSmoTicksize" noBtn=true class="w20vw" />{{$ln('档，送出委托。')}}</div>
						</radio>
					</span>
				</div>
				<div class="divider-bottom" />
				<div class="setting-head font-size-large flex-row pdt2">
					<span class="circle flex-center bgc-B76D16 w20vw mgr2">TS</span>
					<span class="flex-1">{{$ln('移动停损TS')}}</span>
				</div>	
				<div class="content-line flex-row pdb2">
					<span class="label"></span>
					<span class="content flex-col pdtb2">
						<div class="flex-row flex-vertical-center flex-wrap">{{$ln('依据成交后最高價格回撤')}}<inputQty v-model="outer.protectTSTicksize" noBtn=true class="w20vw" />
						{{$ln('档时，以：')}}</div>
						<radio v-model="outer.protectTSType" class="flex-col radio-ctn">
							<div value="TSTOP"><div class="circle-around flex-center  mgtb2 mgr2"><div class="circle-focus" v-if="outer.protectTSType=='TSTOP'"></div></div>
							{{$ln('市价/一定范围市价送出委托。')}}</div>
							<div value="TSTPLMT"><div class="circle-around flex-center mgr2"><div class="circle-focus" v-if="outer.protectTSType=='TSTPLMT'"></div></div>
								{{$ln('限价加挂')}}<inputQty v-model="outer.tsSmoTicksize" noBtn=true class="w20vw" />{{$ln('档，送出委托。')}}</div>
						</radio>
					</span>
				</div>
				<div class="divider-bottom" />
			</scrollBounce>
		</div>
		<!-- 其他 -->
		<div class="overflow-y-auto other-ctn flex-col flex-1 posr" v-if="param=='other'">
			<scrollBounce>
				<div class="setting-head font-size-large">{{$ln('交易设定')}}</div>
				<!-- <div class="setting-line">
					<span class="setting-label">{{$ln('停损限价跳数')}}</span>
					<span class="setting-content">
						<InputQty v-model="other.stopJump" class="w40vw" />
					</span>
				</div> -->
				<div class="setting-line">
					<span class="setting-label">{{$ln('下单确认')}}</span>
					<span class="setting-content">
						<toggle v-model="other.orderConfirm"/>
					</span>
				</div>
				<div class="setting-line">
					<span class="setting-label">{{$ln('平仓确认')}}</span>
					<span class="setting-content">
						<toggle v-model="other.closeConfirm"/>
					</span>				
				</div>
				<div class="divider-bottom" />
				<div class="setting-head font-size-large">
					<span>{{$ln('显示设定')}}</span>
				</div>
				<div class="setting-line">
					<span class="setting-label">{{$ln("显示档位")}}</span>
					<span class="setting-content">
						<radio v-model="other.rowRange" class="radio-group">
							<span value="B">少</span>
							<span value="M">中</span>
							<span value="S">多</span>
						</radio>
					</span>
				</div>
				<div class="setting-line">
					<span class="setting-label">{{$ln('最高低价线')}}</span>
					<span class="setting-content">
						<toggle v-model="other.showLine"/>
					</span>
				</div>
				<div class="setting-line" v-if="twMode">
					<span class="setting-label">{{$ln('记忆进出场策略')}}</span>
					<span class="setting-content">
						<toggle v-model="other.keepStrategy"/>
					</span>
				</div>
				<div class="divider-bottom" />
			</scrollBounce>
		</div>
		<div class="flex-row flex-center pdtb3 space-around">
			<Button class="btn btn-restore w40vw rd6 clr-white bgc-dn" @click="onReset">{{$ln('还原预设值')}}</Button>
			<Button class="btn btn-save w40vw rd6 clr-white bgc-put" @click="onSaveChange">{{$ln('储存修改结果')}}</Button>
		</div>
	</div>
</template>
<script>
import ScrollBounce from '../Framework/ScrollBounce.vue';
export default {
	components: { ScrollBounce },
	data(){
		return {
			isChange: true,
			fastJump: 1,
			backJump: 1,
			dayTrade: '0',
			stateGraphic: '1',
			rowRange: 'B',
			enter:{
				positionEffect: "AUTO",
				stopOrderType: "",
				stopOrderTicksize: 0,
				touchOrderType: "",
				touchOrderTicksize: 0,
				ocoOrderType: "",
				ocoOrderTicksize: 0,
				bkOrderType: "",
				bkOrderTicksize: 0,
			},
			outer: {
				positionEffect: "AUTO",
				protectSPType: "",
				protectSPTicksize: 0,
				spSmoTicksize: 0,
				protectSLType: "",
				protectSLTicksize: 0,
				slSmoTicksize: 0,
				protectTSType: "",
				protectTSTicksize: 0,
				tsSmoTicksize: 0,
			},
			other: {
				orderConfirm: "",		//下單確認
				closeConfirm: "",		//平倉確認
				stopJump: 0,			//停損價跳數
				showLine: "",			//顯示最高低價線1顯示0關閉
				rowRange: "",
				keepStrategy: 0,		//記憶進出場策略
			}
		}
	},
	mounted() {
		// 初始化設定
		let settings = this.$store.state.thunder.settings[this.param];
		for(let key in settings) {
			this[this.param][key] = settings[key];				
		}
	},
	beforeDestroy() {},
	props: ['param'],
	methods: {
		// 重設初始值
		onReset() {
			let settings = this.defaultSettings;
			// 一定範圍市價
			this.$store.state.thunder.useRangeMarket = false;
			for(let key in settings) {
				// 還原預設值
				this[this.param][key] = settings[key];
				// 儲存預設值
				// this.$store.state.thunder.settings[this.param][key] = settings[key];
			}
			this.$store.state.notify(`重设完成`);
		},
		// 储存设定
		onSaveChange() {
			let settings = this[this.param];
			for(let key in settings) {
				this.$store.state.thunder.settings[this.param][key] = settings[key];
			}
			this.$store.state.notify(`储存完成`);
			this.isChange = false;
			// 記錄閃電儲存設定
			console.log('[Thunder] save settings', JSON.stringify(this.$store.state.thunder));
		},
	},
	computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		defaultSettings() {return this.$store.state.thunder_defaultSettings[this.param];},
	},
	watch:{
		"enter.positionEffect"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.stopOrderType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.stopOrderTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.touchOrderType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.touchOrderTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.ocoOrderType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.ocoOrderTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.bkOrderType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"enter.bkOrderTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.positionEffect"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.protectSPType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.protectSPTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.spSmoTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.protectSLType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.protectSLTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.slSmoTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.protectTSType"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.protectTSTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"outer.tsSmoTicksize"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"other.orderConfirm"(nv, ov) {if(nv != ov && ov !=="") this.isChange = true;},
		"other.closeConfirm"(nv, ov) {if(nv != ov && ov !=="") this.isChange = true;},
		"other.stopJump"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"other.showLine"(nv, ov) {if(nv != ov && ov !=="") this.isChange = true;},
		"other.rowRange"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
		"other.keepStrategy"(nv, ov) {if(nv != ov && ov) this.isChange = true;},
	},

}
</script>
<style lang='scss' scoped>
/deep/ .input-qty {
	height: 1.5em !important;
}
.circle {
	width: 13vw;
	height: 13vw;
	border-radius: 50%;
}
.setting-head {
	height: 45px;
	min-height: 45px;
	padding-left: 15px;
	// color: #D47B02;
	@extend .flex-start;
	@extend .flex-item;
}
.setting-line {
	height: 45px;
	min-height: 45px;
	padding: 0 20px;
	@extend .flex-row;
}
.setting-label {
	@extend .flex-start;
}
.setting-content {
	@extend .flex-1, .flex-end;
	> input{ 
		text-align: center;
		min-height: 29px;
		font-weight: bold;
		outline: none;
	}
}
.content{
	padding:0;
	align-items: flex-start;
}
.radio-ctn {
	align-items: flex-start;
	height: auto;
}
.radio-ctn>*{
	padding-left:0;
	padding-right:0;
}
.radio-ctn>.focus {
	background-color: rgba(0,0,0,0);
}
.radio-group {
	border: 1px solid #7E8185;
}
.circle-around {
	width: 5vw;
	height: 5vw;
	border-radius: 50%;
	border:1px solid white;
	align-items: center;
	justify-content: center;
}
.circle-focus {
	width: 4vw;
	height: 4vw;
	border-radius: 50%;
	background-color: rgba(255, 152, 0, 0.932);
}
.bgc-E03434 {
	background: #E03434;
}
.bgc-1B31AB {
	background: #1B31AB;
}
.bgc-6C266F {
	background: #6C266F;
}
.bgc-19B61D {
	background: #19B61D;
}
.bgc-B61616 {
	background: #B61616;
}
.bgc-B76D16 {
	background: #B76D16;
}
.bgc-5756D7{
	background: #5756D7;
}
.content-line .label {
	min-width: 20vw;
}
.break-spaces {
	white-space: break-spaces;
}
.desktop .btn-restore, .desktop .btn-save{
	width: 8em;
}
.desktop .circle {
	width: 2em;
	height: 2em;
}
.desktop .circle-around {
	width: 1em;
	height: 1em;
}
.desktop .circle-focus {
	width: 0.8em;
	height: 0.8em;
}
.desktop .setting-line {
	height:  2.5em;
	min-height: 2.5em;
}
.desktop .content-line .label {
	min-width: 4em;
}
.desktop .thunder-setting-ctn .content /deep/ .input-qty {
	width: 3em;
}
</style>


