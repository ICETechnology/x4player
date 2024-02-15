<template>
	<div class="tcef single-select-ctn" :class="{'posr btn-default-ht-rd flex-1': isFit}">
		<div :class="{'FULL': isFit}">
			<Button v-if="options.length" class="flex-row select-btn pdl3" :class="[{focus:isFocus},btnClass]" @click="popupSelectDialog">
				<span v-if="!componentClass" class="flex-1 flex-start label-ctn ellipsis">{{selectedOptionLabel}}</span>
				<component class="flex-1 flex-center" v-if="componentClass" :is="componentClass" :[classKey]="getValue"></component>
				<i class="material-icons icon-ctn clr-gray">arrow_drop_down</i>
			</Button>
			<div class="flex-1 flex-center no-list btn-default-ht-rd" v-if="!options.length">
				{{$ln('无可使用清单')}}
			</div>
		</div>
	</div>
</template>
<script>
export default {
	// notLn : 不要轉語系
	props: ["value", "options", "dialogHeight", "dialogWidth", "confirmBtn", "option", "componentClass", "classKey", "classVal", "title", "zindex", 'isFit', 'notLn','btnClass'],
	data() {
		return {
			// 響應此選單當前是否被點開 (樣式處理)
			isFocus: false,
			// 當前被選擇的 option (支持 option.selected，未設定時預設首個)
			selectedOption: {},
		};
	},
	beforeMount() {
		if (Array.isArray(this.options)) {
			this.selectedOption = this.options.find(option=>{return option.selected});
			// 帶入列表沒有 selected 但是有帶入的 value 時 -> 選到此 value 選項加入 selected
			if (!this.selectedOption && this.value) {
				this.selectedOption = this.options.find(option=>{return option.value==this.value});
			}
			// 都仍然沒有 selected 時，使用第一個選項作為 selected
			this.selectedOption = this.selectedOption || this.options[0];
			if (this.selectedOption) {
				this.selectedOption.selected = true;
				this.$emit("input", this.selectedOption.value);
			}
		}
	},
	methods: {
		// 點擊下拉選單 -> 彈出單選視窗
		popupSelectDialog() {
			let self = this;
			self.isFocus = true;
			eventBus.$emit("SINGLESELECT-DIALOG", {
				title: self.title,
				options: self.options,
				width: self.dialogWidth,
				height: self.dialogHeight,
				confirmBtn: self.confirmBtn,
				componentClass: self.componentClass,
				classKey: self.classKey,
				classVal: self.classVal,
				zindex: this.zindex,
				notLn: this.notLn,
				onClose: () => {
					self.isFocus = false;
					self.$emit('close');
				},
				onfinish: option => {
					self.selectedOption = option;
					self.$emit('close');
				}
			});
			this.$emit('click');
		},
	},
	computed: {
		getValue(){
			if(!this.options.length) return "";
			return this.classVal? this.selectedOption[this.classVal]: this.selectedOption.value;
		},
		selectedOptionLabel() {
			let txt = this.selectedOption.label || '';
			return this.notLn ? txt : this.$ln(txt);
		},
	},
	watch: {
		// 選項異動時
		options(list) {
			this.selectedOption = list.find(option=>{return option.selected}) || list[0];
			if (this.selectedOption)
				this.selectedOption.selected = true;
		},
		// 點選項目異動時
		selectedOption(nv) {
			if (!nv) return;
			let selectedIndex = this.options.findIndex((opt)=>{return opt.value===nv.value});
			this.$emit("change", nv, selectedIndex);
			this.$emit("input", nv.value);
		},
		// 支持從上層改變 value -> 同步更新選項/UI
		value(nv) {
			// this.selectedOption 有可能是未定義，所以要多判斷。
			if (this.selectedOption && this.selectedOption.value !== nv) {
				let opt = this.options.find(opt => opt.value === nv);
				if (opt) {
					this.options.forEach(opt => {this.$set(opt, 'selected', false);});
					this.$set(opt, 'selected', true);
					this.selectedOption = opt;
				}
			}
		},
	}
};
</script>
<style scoped>
.single-select-ctn .select-btn {
	box-sizing: border-box;
	border: 1px solid #393939;
	color: white;
	background-color: rgba(0,0,0,0);
}
.label-ctn {
	display: block;
}
div.select-btn.ctn {
	display: flex;
	justify-content: space-between;
	padding: 2px 10px;
	border-radius: 10px;
	color: rgb(255, 251, 255, 0.38);
	background-color: rgba(0, 0, 0, 0);
}
div.select-btn.focus {
	border: 1px solid rgb(255, 251, 1);
	background-color: #333;
	color: white;
}
/* 避免字體檔 woff 載入較慢時產生跳動感 */
.icon-ctn {
	width: 24px;
	overflow: hidden;
}
.no-list {
	border: 1px solid gray;
    padding: 2px 10px;
}
/* 以ben設計的ui調整無清單時的高度 */
.single-select-ctn.iceben .no-list{
	padding: 0;
	box-sizing: border-box;
}
.desktop .icon-ctn {
	width: 1em;
}
.clr-pink{
	color: rgb(255, 142, 137) !important;
}
</style>

