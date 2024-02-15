<template>
    <div class="m4c-column-sd hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			storageKey: `${this.$store.state.config.projectID}_ColumnSD_`,
			// 已經 watch 的表 (避免重複 watch)
			watchMap: {},
		}
	},
	beforeMount() {
		let self = this;
		// 支持 Vuex + Window全域
		M4C.ColumnSD = this.$store.state.m4c.columnSD = this;
		// 對所有儲存過的設定做處理 (實測 2.x ms)
		for (let key in localStorage){
			if (key.indexOf(this.storageKey) !== -1) {
				let restoreList = JSON.parse(localStorage.getItem(key));
				// 防止儲存了rowColCnt 導致回報明細發生錯誤，只顯示備註
				if (Array.isArray(restoreList)) {
					// 因quote的cskew與pskew為小寫，因此在取出localstorage時做向前相容處理
					restoreList.forEach((config, idx)=>{
						if(config === 'CSkew')
							restoreList.splice(idx, 1, 'cskew');
						else if(config === 'PSkew')
							restoreList.splice(idx, 1, 'pskew');
					});
					key = key.split(this.storageKey)[1];
					// 有儲存值 -> 恢復儲存值
					// 將欄位恢復為 user 最後記憶的顯示/順序
					this.restore(key, restoreList);
				}
			}
		};
		// 對所有 columnSD 作 初始化(若是沒有儲存) 與 監控改變自動儲存
		for (let key2 in this.columnSD) {
			if (!this.columnSD[key2].show) {
				// 初始化
				this.resetShowHide(key2);
			}
			// 動態監聽顯示欄位陣列改變時 -> 儲存為 key 陣列
			this.watchToStorage(key2);
		}
	},
    mounted() {
		let rowColCnt = localStorage.getItem(`${this.storageKey}quote_rowColCnt`);
		if (rowColCnt)
			this.$store.state.columnSD.quote.rowColCnt = rowColCnt;
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 初始化 or 恢復預設
		resetShowHide(key) {
			let obj = this.columnSD[key];
			this.$set(obj, 'show', obj.default.filter(o=>o && o.show));
			this.$set(obj, 'hide', obj.default.filter(o=>o && !o.show));
			// 恢復預設後就不用存了 (但因有在 watch, 所以要 nextTick 再刪)
			this.$nextTick(()=>{
				localStorage.removeItem(`${this.storageKey}${key}`);
			});
		},
		// 將欄位恢復為 user 最後記憶的顯示/順序
		restore(key, restoreList) {
			let showList = [];
			let hideList = [];
			let obj = this.columnSD[key];
			// 有儲存值但尚未存在於 columnSD 的 (ex. by合約的欄位設定)
			if (!obj) {
				// 複製並建立此 columnKey 的欄位設定 (quote:XXX 時複製 quote)
				obj = this.duplicateColumnKey(key);
			}
			// 以 default 作為基準，尋找最後儲存值，有找到的放到 showList，沒找到的放到 hideList
			if (obj && obj.default) {
				obj.default.forEach(o=>{
					let idx = restoreList.indexOf(o.key);
					if (idx !== -1)
						showList[idx] = o;
					else
						hideList.push(o);
				});
				// localStroage 儲存的key不存在 default時，可能造成showlist有空值，所以濾掉
				showList = showList.filter(o=>o);
				this.$set(obj, 'show', showList);
				this.$set(obj, 'hide', hideList);

			}
			// 嘗試處理執行restore後依然沒有show欄位情形(https://trello.com/c/FaogtWMl/)。
			if(this.columnSD[key] && (this.columnSD[key].show === null || this.columnSD[key].show === undefined)) {
				this.resetShowHide();
			}
		},
		// 顯示欄位陣列 -> 儲存為 key 陣列
		saveLocalStorage(key, showList) {
			let list = showList.map(o=>o.key);
			localStorage.setItem(`${this.storageKey}${key}`, JSON.stringify(list));
		},
		// 動態監聽顯示欄位陣列改變時 -> 儲存為 key 陣列
		watchToStorage(key) {
			let self = this;
			if (this.columnSD[key].autoStorage && !this.watchMap[key]) {
				this.watchMap[key] = true;
				this.$store.watch(state=>state.columnSD[key].show, function(nv, ov) {
					self.saveLocalStorage(key, nv);
				});
			}
		},
		// 複製並建立此 columnKey 的欄位設定 (quote:XXX 時複製 quote)
		duplicateColumnKey(key) {
			// 冒號左邊就是要 duplicate 的來源
			let tmp = key.split(':');
			if (this.columnSD[tmp[0]]) {
				let cloneObj = JSON.parse(JSON.stringify(this.columnSD[tmp[0]]));
				this.$set(this.columnSD, key, cloneObj);
				// 動態監聽顯示欄位陣列改變時 -> 儲存為 key 陣列
				this.watchToStorage(key);
			}
			return this.columnSD[key];
		},
	},
	watch: {
		'$store.state.columnSD.quote.rowColCnt'(nv) {
			localStorage.setItem(`${this.storageKey}quote_rowColCnt`, nv);
		}
	},
    computed: {
		columnSD() {
			return this.$store.state.columnSD;
		},
	},
}
</script>

<style scoped>
</style>