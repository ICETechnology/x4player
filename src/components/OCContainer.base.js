export default {
	data: function () {
		return {
		}
	},
	mounted() {
	},
	methods: {
	},
	computed: {
		/** 庫存合約列表 */
		positionsumList() {
			return this.$store.state.data.normalPositionSumList.map(psd=>psd.SYMBOL);
		},
		filterOptions() {
			let self = this;
			// 價量十字時，帶入自選與庫存
			if (this.componentID === 'VolumeVariety') {
				let list = [];
				// 自選
				this.$store.state.data.ssgList.forEach((ss)=>{
					let obj = {};
					obj.label = ss.label;
					obj.getFilterSymbols = function(){
						console.log(`OptCloudDialog.filterOptions.getFilterSymbols :`, JSON.stringify(ss.param));
						return ss.param;
					};
					list.push(obj);
				});
				// 庫存
				list.push({
					label: this.$ln('我的库存'),
					getFilterSymbols: function(){
						console.log(`OptCloudDialog.filterOptions.getFilterSymbols :`, JSON.stringify(self.positionsumList));
						return self.positionsumList;
					},
				});
				return list;
			}
		},
	},
	watch: {
	},
}