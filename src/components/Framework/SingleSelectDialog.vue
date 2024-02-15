<template>
	<transition name="show">
		<div class="single-select-dialog flex-col wrapper" :style="{'z-index': zindex}" v-if="selectData && Object.keys(selectData).length>0" @click.self="close">
			<div class="flex-col flex-horizontal-center">
				<!-- <div class="flex-bottom-right"><i data-v-13ff3634="" class="material-icons md-36" @click.self="close">close</i></div> -->
				<div class="container fd-content-bgc" :style="dialogWidth">
					<div class="selheader fd-content-bdbc" v-if="selectData.title">{{$ln(selectData.title)}}</div>
					<div
						class="flex-item content scrolling-y optionList" ref="optionList"
						:style="(selectData.height?'max-height:'+selectData.height+'px':'')"
					>
						<ul class="selul" ref="selul">
							<li v-for="(ops, key) in selectData.options" :key="key"  @click="setSelected(ops,key)" class="radioitem flex-row fd-content-bdbc tcef" 
								:class="[selectData.type=='checkbox'?'favorite':'', {'opt-selected':ops.selected}]">
								<label v-if="!selectData.componentClass" :for="ops.value" class="radiobtn flex-1 h100p flex-start mgl3">{{ops.label}}</label>
								<component :for="ops.value" class="radiobtn flex-1 h100p flex-start mgl3" v-if="selectData.componentClass" 
									:is="selectData.componentClass" :[selectData.classKey]="ops[selectData.classVal]"></component>
								<div class="flex-end posr" :class="{'material-icons star-icon': selectData.type=='checkbox','check': !selectData.type || selectData.type=='radio','selected':ops.selected}">
									{{selectData.type=='checkbox'?'star':''}}
								</div>
							</li>
						</ul>
					</div>
					<div v-if="selectData.type=='checkbox'" class="flex-center selfooter fd-content-bdtc tcef" @click="onConfirm">{{$ln('完成')}}</div>
					<div v-if="selectData.type!='checkbox'" class="flex-center selfooter fd-content-bdtc tcef" @click="close">{{$ln('取消')}}</div>
				</div>
			</div>
		</div>
	</transition>
</template>
<script>
import { setTimeout } from 'timers';
var VueScrollTo = require('vue-scrollto');
export default {
	data() {
		return {
			checked:[],
			// name: this.selectData.t || "singleselect" + this._uid,
			selectedOption: [{'value':'', 'selected':'','label':''}],
			dialogWidth: {},
			dialogHeight: {}
		};
	},
	beforeMount(){
		let self = this;
		// 彈出單選器視窗(新)
		eventBus.$on("SINGLESELECT-DIALOG", (param)=>{
			self.$store.state.sync.singleSelectData = param;
			// (非iOS) 利用 pushState + popState 以支持 Back-Button
			if (!self.$store.state.device.isDeviceIOS)
				history.pushState({isPortrait: self.$store.state.status.isPortrait}, '');
		});
		// 關閉單選器視窗(新)
		eventBus.$on("CLOSE-SINGLESELECT", ()=>{
			if (self.$store.state.device.isDeviceIOS)
				self.$store.state.sync.singleSelectData = null;
			else
				history.back();
		});
	},
	beforeDestroy() {
		eventBus.$off("SINGLESELECT-DIALOG");
		eventBus.$off("CLOSE-SINGLESELECT");
	},
	computed: {
		/** 單選器資料 */
		selectData() {
			return this.$store.state.sync.singleSelectData;
		},
		name(){
			if(this.selectData)
				return this.selectData.t || "singleselect" + this._uid;
		},
		zindex() {
			if(this.selectData)
				return this.selectData.zindex;
		},
	},
	watch: {
		selectData: function(data) {
			// 找 option 裡有 selected:true 的作為已選擇的 option
			if (data && data.options) {
				let self = this;
				// 支持 notLn 指定不要轉語系
				let notLn = this.selectData.notLn;
				if (!notLn) {
					data.options.forEach(ops => {
						ops.label = self.$ln(ops.label);	//轉語系
					});
				}
				if(this.selectData.type == 'checkbox'){
					this.checked = data.options.filter(ops => ops.selected).map(obj => obj.value);
					this.selectedOption = Object.assign([], this.selectedOption, data.options);
				}
				else{
					this.checked = data.options.filter(ops => ops.selected).map(obj => obj.value)[0];
					this.selectedOption = data.options.filter(opt=>{return opt.selected})[0];
					//設定寬高
					if(data && data.width){
						this.dialogWidth['max-width'] = data.width+'px';
						this.dialogWidth['min-width'] = data.width+'px';
					}
					if(data && data.height){
						this.dialogHeight['max-height'] = data.height+'px';
						this.dialogHeight['min-height'] = data.height+'px';
					}
				}
				// 等待ui生成後才執行
				setTimeout(() => {
					this.scrollTo();
				}, 16);			
			}
		}
	},
	methods: {
		scrollTo() {
			let target = this.$refs.selul.getElementsByClassName('opt-selected')[0];
			// 沒有已選取的項目不捲動
			if(!target) return;
			let top = this.$refs.selul.offsetTop;
			let bottom = this.$safeFloat(top + this.$refs.selul.offsetHeight);
			// 簡易判斷是否需要捲動。
			let needScroll = target && target.offsetTop >= bottom;
			let body = this.$refs.optionList;
			let bodyHeight = body.clientHeight;
			let elHeight = target.clientHeight;
			if(needScroll){
				VueScrollTo.scrollTo(target, 1, {
						container: body,
						// 設定置中
						offset: -bodyHeight/2 + elHeight/2,
						x: false,
						y: true,
				});
			}
		},
		getParam(){
			let jsonObj = {};
			jsonObj[this.classKey] = this.selectedOption[this.classVal];
			return jsonObj;
		},
		// 點擊選取本 option
		setSelected(opt,idx) {
			eventBus.$emit("SWITCHDATA");
			if(this.selectData.type == 'checkbox'){
				//多選情境
				this.$set(opt,'selected',!opt.selected);
			}else{
				//單選情境
				// 移除前個 option 的 selected
				if (this.selectedOption)
					delete this.selectedOption.selected;
				// 本 option 加入 selected: true
				this.$set(opt,'selected',true);
				this.selectedOption = opt;
				// 免確認按鈕情境
				if (!this.selectData.confirmBtn) {
					let self = this;
					setTimeout(() => {
						self.onConfirm();
					},0);
				}
			}
		}, 
		// 點擊確認
		onConfirm() {
			// if(this.selectData.confirmBtn && (typeof this.selectData.onfinish == "function")){
			if(typeof this.selectData.onfinish == "function"){
				if(this.selectData.type == 'checkbox'){
					this.selectData.onfinish(this.selectData.options);
				}
				else{
					this.selectData.onfinish(this.selectedOption);
				}
			}
			this.close();
		},
		// 關閉
		close() {
			if (typeof this.selectData.onClose == "function") {
				this.selectData.onClose();
			}
			//清除寬、高設定
			this.dialogWidth = {};
			this.dialogHeight = {};

			eventBus.$emit("CLOSE-SINGLESELECT");
		}
	}
}
</script>
<style scoped>
/* singleSelect-style */
.optionssel {
	padding: 4px 8px;
	border: 1px solid rgba(255, 255, 255, 0.548);
	border-radius: 10px;
	min-width: 120px;
}
.optionssel span {
	color: rgba(255, 255, 255, 0.548);
}
.optionssel i {
	line-height: 0;
	float: right;
}
/* Popup style */
.wrapper {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	z-index: 8;
	background-color: rgba(0, 0, 0, 0.5);
	justify-content: center;
	align-items: center;
}
.container {
	max-width: 70vw;
	min-width: 70vw;
	border-radius: 3vw;
}
.selheader {
	height: 20px;
	text-align: center;
	padding: 4vw 0;
	border-bottom: 1px solid ;
}
.content {
	max-height: 65vh;
	min-height: 50px;
	padding: 0 2.6vw;
	overflow-y: scroll;
}
.selfooter {
	min-height: 20px;
	padding: 2vw 0;
	border-top: 1px solid;
}
.selbutton {
	width: 70px;
}
/* RadioLis style */
.selul {
	list-style: none;
	padding: 0;
	min-width: 100%;
	justify-content: space-around;
	align-items: center;
	flex-flow: column;
	margin: 0;
}
.radiobtn{
    max-width: calc(100% - 2em);
	word-break: break-word;
}
.selul li {
	position: relative;
	float: left;
	width: 100%;
	min-height: 12vw;
	padding: 2px 0;
	line-height: 1.2em;
}
.selul li:not(:last-child){
	border-bottom: 1px solid;
}

.selul li input {
	position: absolute;
	visibility: hidden;
}
.selul li .check {
	border-radius: 100%;
	height: 13px;
	width: 13px;
	margin: auto;
	transition: border 0.25s linear;
	-webkit-transition: border 0.25s linear;
}

.selul li .check::before {
	position: absolute;
	content: "";
	border-radius: 100%;
	height: 17px;
	width: 17px;
	margin: auto;
	transition: background 0.25s linear;
	-webkit-transition: background 0.25s linear;
	border: 1px solid white;
	right: -3px;
}

.selul .check.selected{
	background: rgba(255, 152, 0, 0.932);
}
.radioitem {
	min-height: 31px;
	display: flex;
	align-items: center;
}
.selul .favorite{
	position: relative;
    display: flex;
	justify-content: space-between;
	margin-right: 5px;
    flex: 1;
}
.star-icon{
	position: absolute;
    right: 10px;
}
.selul .star-icon.selected{
	color:rgb(255, 152, 0);

}

/** 桌機版 */
.desktop .wrapper {
	z-index: 100;
}
.desktop .container {
	max-width: 350px;
	min-width: 350px;
	border-radius: 6px;
	z-index: 100;
}
.desktop .content {
	max-height: 50vh;
	min-height: 50px;
	padding: 0 20px;
}
.desktop .selul li {
	padding: 10px 0;
	min-height: auto;
	line-height: auto;
}
.desktop .selfooter {
	padding: 10px 0;
}
.desktop .selheader{
	padding: 0.5em 0;
}
.desktop .scrolling-y{
	overflow-y: auto;
}
@media screen and (orientation: landscape) {
	.selul li {
		min-height: 48px;
	}
}
</style>