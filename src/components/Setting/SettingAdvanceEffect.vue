<template>
	<ScrollBounce v-stop-propagation-y>
		<!-- 動線音效 -->
		<div class="pdt2 pdb5 flex-col font-size-small">
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`报单音效`)}}</div>
				<div class="flex-center">
					<Toggle v-model="$store.state.config.soundEffect" />
				</div>
			</div>
			<template v-if="$store.state.config.soundEffect">
				<div class="mgl5 setting-line flex-row flex-center" v-for="(set, key) in orderEffectList" :key="set.n">
					<div class="flex-1 flex-col clr-gray">{{$ln(set.n)}}</div>
					<div class="flex-row flex-center opt-label rd2 ht2 mg2" @click="onSelClick(set.k, key)">
						<div class="flex-1 flex-start pdl2">{{$ln(getLabel(set.k))}}</div>
						<i class="material-icons font-size-normal">arrow_drop_down</i>
					</div>
					<Button class="pdlr3" @click="playEffect($store.state.config.advanceEffectSetting[set.k])" 
						:class="{disabled: $store.state.config.advanceEffectSetting[set.k]=='mute'}">
						<i class="font-size-xl material-icons">play_circle_outline</i>
					</Button>
				</div>				
			</template>
			
			<div class="divider-bottom mgb2 mgt4 mglr5" />

			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`動線音效`)}}</div>
				<div class="flex-center">
					<Toggle v-model="$store.state.config.fllowEffect" />
				</div>
			</div>
			<template v-if="$store.state.config.fllowEffect">
				<div class="mgl5 setting-line flex-row flex-center" v-for="(set, key) in flowEffectList" :key="set.n">
					<div class="flex-1 flex-col clr-gray">{{$ln(set.n)}}</div>
					<div class="flex-row flex-center opt-label rd2 ht2 mg2" @click="onSelClick(set.k, key)">
						<div class="flex-1 flex-start pdl2">{{$ln(getLabel(set.k))}}</div>
						<i class="material-icons font-size-normal">arrow_drop_down</i>
					</div>
					<Button class="pdlr3" @click="playEffect($store.state.config.advanceEffectSetting[set.k])" 
						:class="{disabled: $store.state.config.advanceEffectSetting[set.k]=='mute'}">
						<i class="font-size-xl material-icons">play_circle_outline</i>
					</Button>
				</div>
			</template>
			<div class="divider-bottom mgb2 mgt4 mglr5" />

			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`資料音效`)}}</div>
				<div class="flex-center">
					<Toggle v-model="$store.state.config.dataEffect" />
				</div>
			</div>
			<template v-if="$store.state.config.dataEffect">
				<div class="mgl5 setting-line flex-row flex-center" v-for="(set, key) in dataEffectList" :key="set.n">
					<div class="flex-1 flex-col clr-gray">{{$ln(set.n)}}</div>
					<div class="flex-row flex-center opt-label rd2 ht2 mg2" @click="onSelClick(set.k, key)">
						<div class="flex-1 flex-start pdl2">{{$ln(getLabel(set.k))}}</div>
						<i class="material-icons font-size-normal">arrow_drop_down</i>
					</div>
					<Button class="pdlr3" @click="playEffect($store.state.config.advanceEffectSetting[set.k])" 
						:class="{disabled: $store.state.config.advanceEffectSetting[set.k]=='mute'}">
						<i class="font-size-xl material-icons">play_circle_outline</i>
					</Button>
				</div>
			</template>
		</div>
	</ScrollBounce>
</template>
<script>
import AudioOptionCard from '@/components/Framework/AudioOptionCard'
export default {
	props:["expand"],
	data(){
		return {
			settingList:[
				{n: "委託成功", d: "", k: "order", type: "order"},
				{n: "完全成交", d: "", k: "report_filled", type: "order"},
				{n: "委託失败", d: "", k: "report_error", type: "order"},
				{n: "发送委托", d: "", k: "sendOrder", type: "flow"},
				{n: "切换版面", d: "", k: "switchPage", type: "flow"},
				{n: "切换页签", d: "", k: "switchTab", type: "flow"},
				{n: "弹出视窗", d: "", k: "popupDialog", type: "flow"},
				{n: "关闭视窗", d: "", k: "closeDialog", type: "flow"},
				{n: "下拉重查", d: "", k: "reloadData", type: "flow"},
				{n: "查询成功", d: "", k: "queryResult_done", type: "data"},
				{n: "查询失败", d: "", k: "queryResult_fail", type: "data"},
				{n: "重查无资料", d: "", k: "queryResult_noData", type: "data"},
				{n: "功能列展开", d: "", k: "expand", type: "flow"},
				{n: "即时tick", d: "", k: "rtTick", type: "data"},
				{n: "输入改变", d: "", k: "iptChange", type: "data"},
				{n: "滑入侧边选单", d: "", k: "slideInMenu", type: "flow"},
				{n: "滑出侧边选单", d: "", k: "slideOutMenu", type: "flow"},
				{n: "切换资料", d: "", k: "switchData", type: "data"},
				// {n: "启动完成", d: "", k: "startComplete"},
			],
			shortList: [],
		}
	},
	components: {AudioOptionCard},
	created() {
		for(let key = 0; key < this.settingList.length; key++){
			let shortlist = [];
			shortlist = this.effectList;
			this.shortList.push(this.$store.state.fn.$disObserver(shortlist));		
			this.$set(this.settingList[key], "d", this.$store.state.config.advanceEffectSetting[this.settingList[key].k]);
		}
	},
	mounted() {},
	methods:{
		getLabel(key) {
			let opt = this.$store.state.config.soundEffectUri.find(li=>{
				return li.v == this.$store.state.config.advanceEffectSetting[key];
			});
			if(opt){
				return opt.n;
			}
			else
				return this.$store.state.config.advanceEffectSetting[key];
		},
		onSelClick(key, idx) {
			this.shortList[idx].map(opt=>{
				let selected = opt.value == this.$store.state.config.advanceEffectSetting[key];
				opt.selected = selected;
				return opt;
			});
			// 彈出選單
			eventBus.$emit("SINGLESELECT-DIALOG", {
				options: this.shortList[idx],
				confirmBtn: false,
				componentClass: AudioOptionCard,
				classKey: "param",	// 要傳遞給元件的 prop 名稱
				classVal: "value",	// 要傳遞 option 哪個 key 的內容
				onfinish: opts => {
					if (!opts) return;
					this.$store.state.config.advanceEffectSetting[key] = opts.value;
				}
			});
		},
		// 播放demo音效
		playEffect(src){
			eventBus.$emit("DEMOEFFECT", {src: src});
		},
	},
	computed:{
		// 音效清單
		effectList(){
			let list = this.$store.state.config.soundEffectUri.map(ef => {
				return {"label":ef.n ,"value": ef.v }
			});
			list.unshift({"label":"mute" ,"value": "mute"});
			return list
		},
		// 動線音效清單
		flowEffectList(){
			return this.settingList.filter(data => data.type === "flow");
		},
		dataEffectList(){
			return this.settingList.filter(data => data.type === "data");
		},
		orderEffectList(){
			return this.settingList.filter(data => data.type === "order");
		}
	},
}
</script>
<style scoped>
.setting-line {
    min-height: 12vw;
    padding: 0 5vw;
}
.opt-label {
	background-color: white;
	min-width: 25vw;
	color:black;
}
.effect-ctn{
	height: 70vw;
	max-height: 70vw;
	overflow-y: auto;
	background-color: #000E0E;
}
/* 中央漸現出效果 */
.grow-leave-to, .grow-enter {
	opacity: 0;
	width: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.grow-leave-active, .grow-enter-active {
	transition-duration: 0.25s;
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.grow-leave, .grow-enter-to {
	opacity: 1;
	width: 100%;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
/** 桌機版 */
.desktop .setting-line {
	min-height: 3em;
	padding: 0 1em;
}
.desktop .opt-label {
	min-width: 7em;;
}
.desktop .effect-ctn {
	min-height: 10em;
}
</style>