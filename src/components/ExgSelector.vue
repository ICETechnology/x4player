<template>
	<div class="body flex-1 font-size-small scrolling-y" v-stop-propagation-y>
		<!-- 自選/庫存 -->
		<div class="opt-block" v-if="!only || only == 'self'">
			<div class="flex-row self-head list-label mgb3">
				<label class="flex-column clr-gray font-bold">{{$ln('自选')}}</label>
				<span v-if="twMode && multiSS" class="clr-orange tcef" @click="onBtnEdit">{{$ln('编辑自选')}}</span>
			</div>
			<!-- <1> 關注 -->
			<Button v-if="!multiSS" class="btn outline mgtb2 pdlr3 flex-start" @click="onBtnClick({id:'focus'})" :class="{'selected': 'focus' === focusID}">
				{{$ln('关注')}}</Button>
			<!-- <2> 多組自選機制 -->
			<div v-if="multiSS" class="flex-row list-block">
				<Button class="btn outline mgtb2 pdlr3 flex-start" v-for="(obj, i) in selList" @click="onBtnClick(obj, i)"
					:class="{'selected': obj.id === focusID}" :key="`ExgSelector-sel-${i}`"
				>{{$ln(obj.name)}}</Button>
			</div>
		</div>
		<!-- 期貨交易所 -->
		<div class="opt-block" v-if="!only || only == 'fut'">
			<div class="flex-row list-label mgb3">
				<label class="clr-gray font-bold">{{$ln('交易所')}}</label>
			</div>
			<div class="flex-row list-block">
				<Button class="btn outline mgtb2 pdlr3 flex-start" @click="onBtnClick({id:'FUTHOTLIST'}, selList.length+1)" v-if="!twMode"
					:class="{'selected': 'FUTHOTLIST' === focusID}">{{$ln("期货主力合约")}}</Button>
				<Button class="btn outline mgtb2 pdlr3 flex-start" v-for="(obj, i) in exgList" @click="onBtnClick(obj, selList.length+1+i)"
					:class="{'selected': obj.id === focusID}" :key="`ExgSelector-fut-${i}`"
				>{{obj.name}}</Button>
			</div>
		</div>
	</div>
</template>

<script>
import SelfSelectEditor from "@/components/Framework/SelfSelectEditor.vue";
export default {
	data() {
		return {
		};
	},
	props: ['param'],
	created() {},
	components: {},
	beforeMount() {
		this.$emit('title', `交易所选择`);
	},
	mounted() {},
	methods: {
		/** 編輯自選 */
		onBtnEdit() {
			eventBus.$emit("POPUP-DIALOG", SelfSelectEditor, "", {$HEAD: {title: this.$ln(`编辑自选`)}});
		},
		/** 點擊 自選/交易所 按鈕 */
		onBtnClick(obj, idx) {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			eventBus.$emit("CLOSE-DIALOG");
			if (this.selectID) 
				this.selectID = obj.id;
			else
				this.$store.commit("setQuoteTabID", obj.id);
		}
	},
	computed: {
		only() {if(this.param) return this.param.only;},
		focusID() {
			if(this.selectID)
				return this.selectID;
			else
				return this.$store.state.status.quoteTabID;
		},
		selectID: {
			get: function () {
				if(this.param) return this.param.selectID;
			},
			set: function (newValue) {
				this.param.selectID = newValue;
			},
		},
		/** 分類表內容 響應式 by M4C.Symbol.getClassification */
		classification: function() {
			return M4C.Symbol.getClassification(this.$store.state.config.classification);
		},
		/** 交易所內容 響應 by classification */
		exgList: function() {
			let list = [];
			// 處理TabGroup所需要的資料
			this.classification.forEach((exgItem)=>{
				if (exgItem.Node) {
					list.push({
						id: exgItem.ENG,
						name: exgItem[this.$store.state.lang.mainformLangKey],
					});
				}
			});
			return list;
		},
		/** 库存+自選群組 內容 (響應式 by $store.state.data.ssgList) */
		selList: function() {
			let posList = [{id: "position", name: "我的库存"}];
			let selList = this.$store.state.data.ssgList.map(group => {
				return {
					id: `selfselect.idx.${group.idx}`,
					name: group.label,
				};
			});
			return posList.concat(selList);
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 啟用多組自選機制
		multiSS() {
			return this.$store.state.config.publicPdSetting.function.multiSS;
		},
	},
};
</script>
<style scoped>
.opt-block {
	padding: 10px 19px;
}
.self-head {
	justify-content: space-between;
}
.btn {
	/* 為了讓內容稱開高度，不可使用 box-sizing: border-box，導致 border 與 padding 會影響 size，因此需要調整 */
	width: 36.5vw;
	height: 11vw;
}

/** 桌機版 */
.desktop .btn {
	width: 137px;
	height: 41px;
}
</style>
