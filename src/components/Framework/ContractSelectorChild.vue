<template>
	<div class="flex-row">
		<SingleSelect :class="['flex-1 sselect', isContract?'contract':'']" :options="optionList" @change="onSelectChange" v-show="thisDisplay"/>
		<ContractSelectorChild class="flex-1" v-if="nextNodeList" :node-list="nextNodeList" :default-select="nextSelectIdxList"
			@contract-change="onContractChange" :displayList="nextDisplayList"/>
	</div>
</template>

<script>
export default {
	props: ["nodeList", "defaultSelect", "displayList"],
	data() {
		return {
			// 本層要投入 SingleSelect 的資料格式
			optionList: [],
			// 要繼續送給下層的分類表資料
			nextNodeList: null,
			// 本層是否為合約層(最末層)
			isContract: false,
			// 每一層要停留的 index (Array), (複製傳入值來使用/變更)
			defaultSelectList: this.defaultSelect ? this.defaultSelect.slice(0) : null,
			// 本層應選到的 index
			thisSelectIdx: 0,
			// 下層應選到的 index (Array)
			nextSelectIdxList: null,
			// 本層是否要顯示
			thisDisplay: true,
			// 下層是否要顯示 boolean (Array)
			nextDisplayList: null,
        }
	},
	created() {
		// 啟動預設執行一次
		this.propReload();
		this.thisDisplay = this.displayList ? !!this.displayList[0] : true;
		this.nextDisplayList = this.displayList ? this.displayList.splice(1) : null;
	},
    methods: {
		// 本層資料 --轉-> SingleSelect資料
		getOptionList: function(list){
			if (!list) return [];
			let optList = [];
			list.forEach((elm, idx)=>{
				let label = elm['LABEL'] || elm['CHS'];
				let value = elm['VALUE'] || elm['CHS'];
				optList.push({'label': label, 'value': value, 'data': elm});
			});
			// 本層是否為合約層(最末層)
			this.isContract = list[0].isContract;
			let selectOpt = optList[this.thisSelectIdx];
			if (selectOpt) {
				selectOpt.selected = true;
				// 合約層時 -> 送出預設的商品連動
				if (this.isContract) {
					this.onContractChange(selectOpt.value, []);
				}
			}
			return optList;
		},
		// 取得下一層資料
		getNextNodeList: function(optData) {
			if (!optData) return;
			optData = optData.data || optData;
			let list = optData.Node || [];
			// 合約層時
			if (optData.Contracts) {
				optData.Contracts.forEach((sid)=>{
					list.push({"LABEL": M4C.Symbol.getCNM4(sid), "VALUE": sid, "isContract": true});
				});				
			}
			return list.length > 0 ? list : null;
		},
		// 選單切換
		onSelectChange: function(opt, idx) {
			let optData = this.optionList.filter(option=>{return option.value === opt.value})[0];
			this.nextNodeList = this.getNextNodeList(optData);
			this.thisSelectIdx = idx;
			// 本層是合約層(最末層)
			if (this.isContract) {
				this.onContractChange(opt.value, []);
			}
		},
		// 上層傳入資料有異動
		propReload: function() {
			// 本層預設的 selected-idx
			this.thisSelectIdx = this.defaultSelectList ? this.defaultSelectList[0] : 0;
			// 下層預設的 selected-idx (Array)
			this.nextSelectIdxList = this.defaultSelectList ? this.defaultSelectList.splice(1) : null;
			// 本層要投入 SingleSelect 的資料格式
			this.optionList = this.getOptionList(this.nodeList);
			// 要繼續送給下層的分類表資料
			this.nextNodeList = this.getNextNodeList(this.nodeList[this.thisSelectIdx]);
		},
		// 合約層異動 -> 往上層送出
		onContractChange(value, idxList) {
			idxList.unshift(this.thisSelectIdx);
			this.$emit("contract-change", value, idxList);
		}
	},
	watch: {
		// 上層傳入資料有異動
		nodeList: function() {
			this.defaultSelectList = null;
			this.propReload();
		}
	},
}
</script>

<style scoped>
</style>