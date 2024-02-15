<template>
	<div class="wrapper">
		<div class="head flex-start">
			<BtnBack></BtnBack>
			<span>{{$ln('交易所选择')}}</span>
		</div>
		<div class="body flex-1 font-size-small">
			<div class="self-options opt-block">
				<div class="flex-row self list-label">
					<label class="flex-column">{{$ln('自选')}}</label>
					<span class="edit" @click="openOptionGroup">{{$ln('编辑自选')}}</span>
				</div>
				<div class="flex-row list-block">
					<Button
						v-for="(li,key) in self"
						:key="key"
						class="btn"
						:class="isSelected(li.label,'self')"
						@click="active(li,'self',key)"
					>{{$ln(li.label)}}</Button>
				</div>
			</div>
			<!-- <div class="inside-exchange opt-block">
				<div class="flex-row list-label">
					<label>内盘交易所</label>
				</div>
				<div class="flex-row list-block">
					<Button
						v-for="(li,key) in inside"
						:key="key"
						class="btn"
						:class="isSelected(li,'inside')"
						@click="active(li,'inside',key)"
					>{{li}}</Button>
				</div>
			</div> -->
			<div class="options-exchange opt-block">
				<div class="flex-row list-label">
					<label>{{$ln('外期交易所')}}</label>
				</div>
				<div class="flex-row list-block">
					<Button
						v-for="(li,key) in option"
						:key="key"
						class="btn"
						:class="isSelected(li.value,'opt')"
						@click="active(li,'opt')"
					>{{li.label}}</Button>
				</div>
			</div>
			<!-- <div class="outside-exchange opt-block">
				<div class="flex-row list-label">
					<label>外盘交易所</label>
				</div>
				<div class="flex-row list-block">
					<Button
						v-for="(li,key) in outside"
						:key="key"
						class="btn"
						:class="isSelected(li,'outside')"
						@click="active(li,'outside',key)"
					>{{li}}</Button>
				</div>
			</div> -->
		</div>
	</div>
</template>
<script>
import BtnBack from "@/components/BtnBack.vue";
import Button from "@/components/Framework/Button.vue";
export default {
	data() {
		return {
			clsList: {},
			grpList: {},
			selected: "",
			position: "",
			self: ["库存自选", "自选群组1", "自选群组2"],
			inside: [
				"中国金融交易所",
				"大连商品交易所",
				"上海期货交易所",
				"上海能源交易中心"
			],
			option: ["大商所", "郑商所", "上期所", "上交所"],
			outside: [
				"纽约NYMEX",
				"纽约COMEX",
				"芝商所CME",
				"芝加哥CBOT",
				"芝商所CBOE",
				"洲际ICE",
				"瑞士EUREX",
				"伦金所LME",
				"香港HKEX"
			]
		};
	},
	created() {
		this.clsList = M4C.Symbol.getClassification("FMM_FREXG");
		this.grpList = M4C.SelfGroup.getGroup();
	},
	computed: {},
	components: { BtnBack },
	mounted() {
		//UI預設值
		let es = localStorage.getItem(this.$genKey("EXCHANGE_SELECT_SEL")); //上次選擇的交易所
		let pos = localStorage.getItem(this.$genKey("EXCHANGE_SELECT_POS")); //上次選擇的交易所(區塊)
		if (es && pos) {
			this.selected = es;
			this.position = pos;
		} else {
			this.selected = this.self[0]; //預設選項
			this.position = "self";
		}
		//UI資料
		if (this.clsList) {
			//期權交易所資料
			let lengCode = this.$store.getters.getMainformLangKey;
			this.option = this.clsList.map((li, k) => {
				let label = li[lengCode];
				//以ENG的資料當value
				return { label: label, value: li['ENG']};
			});
		}
		if (this.grpList) {
			this.self = this.grpList;
		}
	},
	methods: {
		parseLabelLang(label){
			if(!label) return;
			return label.replace(/[\d]/g,'');
		},
		openOptionGroup() {
			eventBus.$emit("POPUP-DIALOG", "OptionGroup", this.grpList);
		},
		isSelected(value, pos) {
			let isSel = value == this.selected && pos == this.position;
			return isSel ? "selected" : "";
		},
		active(target, pos) {
			this.selected = target.value;
			this.position = pos;
			let esSel = target.value || target.label;
			//設定localstorage
			localStorage.setItem(this.$genKey("EXCHANGE_SELECT_SEL"), esSel);
			localStorage.setItem(this.$genKey("EXCHANGE_SELECT_POS"), pos);
			//發出ES-CHANGE事件
			this.sendESChange();
			//關閉DIALOG
			this.close();
		},
		sendESChange() {
			eventBus.$emit("GET-GROUP");
		},
		close() {
			eventBus.$emit("CLOSE-DIALOG");
		}
	}
};
</script>
<style lang="scss" scoped>
.head {
	padding: 0 10px;
	background-color: #333;
}
.body {
	padding: 15px;
	border: 4px solid #333;
	overflow: scroll;
	height: calc(100% - 87px);
}
.opt-block {
	padding: 10px 0;
	border-bottom: 2px solid gray;
	&:last-of-type {
		border: 0px;
	}
}
.list-label {
	margin-bottom: 15px;
}
.self {
	justify-content: space-between;
}
.edit {
	color: rgb(0, 136, 113);
}
.list-block {
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	@extend .text-align-center, .flex-vertical-center;
}
.btn {
	margin: 5px 0;
	min-height: 3em;
	max-width: 25%;
	min-width: 25%;
	border: 1px solid #373737;
}
.selected {
	border: 1px solid rgb(255, 152, 0);
	color: rgb(255, 152, 0);
}
.body label {
	@extend .font-size-big;
}
</style>
