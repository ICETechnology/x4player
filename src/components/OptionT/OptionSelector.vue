<template>
    <div class="option-selector-ctn flex-row">
		<SingleSelect :options="opt1List" v-model="opt1Val" />
		<SingleSelect :options="opt2List" v-model="opt2Val" />
    </div>
</template>

<script>
export default {
	props: ["contracts"],
	data() {
		return {
			opt1Val: '',
			opt2Val: '',
			// 當前商品對應的Node
			curSymbolNode: {},
			curMonthNode: {},
		}
	},
	beforeMount() {
		this.cls = M4C.Symbol.getClassification("OPT");
		this.opt1Val = this.cls[0].ENG;
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		nodeToList(node) {
			let list = [];
			let langCode = this.$store.state.lang.mainformLangKey;
			node.forEach((obj)=>{
				list.push({
					'label': obj[`${langCode}_M`] || obj[langCode],
					'value': obj.ENG,
				});
			});
			return list;
		}
	},
	watch: {
		opt2Val(nv) {
			let result = {};
			this.curSymbolNode[nv].Node.forEach((monthObj)=>{
				let obj = result[monthObj.ENG] = {};
				obj.C = monthObj.Node[0].Contracts;
				obj.P = monthObj.Node[1].Contracts;
			});
			this.$emit("input", result);
		},
	},
    computed: {
		// 交易所層級
		opt1List() {
			return this.nodeToList(this.cls);
		},
		// 商品層級
		opt2List() {
			console.log(`OptionSelector.opt1Val : `, this.opt1Val);
			let node = M4C.Symbol.getExgNodeByExgId("OPT", this.opt1Val);
			if (node) {
				// console.log(`OptionSelector.node : `, node);
				node.Node.forEach((obj)=>{this.curSymbolNode[obj.ENG] = obj;});
				// console.log(`OptionSelector.node.Node : `, node.Node);
				let list = this.nodeToList(node.Node);
				// console.log(`OptionSelector.list : `, node.list);
				return list;
			}
		},
	},
}
</script>

<style>
.option-selector-ctn .down {
	margin-left: -2vw;
}
</style>