<template>
	<div class="indicator-selector-ctn flex-col flex-1">
		<!-- 搜尋列 -->
		<div class="search-ctn flex-row">
			<span class="search-icon flex-center" v-html="$tvc.icon.search" />
			<input ref="searchInput" class="input-ctn flex-1" v-model="searchText" :placeholder="$tvc.locale==='zh'?'搜寻':'搜尋'" />
		</div>
		<!-- tag列，有搜尋文字時不顯示tag -->
		<div class="tags-ctn" v-if="!searchText">
			<div class="flex-row tag-row flex-wrap">
				<span class="tag-item flex-center all" :class="{'tagfucus': selectTag == ''}" @click="()=>{selectTag=''}" >全部</span>
				<span class="tag-item flex-center" :class="{'tagfucus': selectTag == tag}" v-for="(tag, key) in tags" :key="key" @click="()=>{selectTag=tag}">{{tag}}</span>
			</div>
		</div>
		<!-- 指標清單列 -->
		<div class="indicator-script-list-ctn flex-col flex-1" v-stop-propagation-y>
			<label class="label-name clr-gray2">{{$tvc.locale==='zh'?'脚本名称':'腳本名稱'}}</label>
			<div class="list-ctn posr flex-col flex-1">
				<div class="FULL overflow-y-auto list-ul">
					<div class="list-li clr-gray" v-for="(sc, idx) in filterList" :key="idx" @click="onSelect(sc)">
						<span class="script-item">{{sc.name}}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	props: ['param'],
	data() {
		return {
			/** 搜尋文字 */
			searchText: "",
			/** 選取tag */
			selectTag: "",
			/** tag清單 */
			tags: [],
		}
	},
	mounted() {},
	methods: {
		/** 關閉選單 */
		onClose() {
			this.$emit("close");
		},
		/** 選取指標 */
		onSelect(data) {
			this.param.addIndicator(data.value);
			eventBus.$emit("CLOSE-DIALOG");
		},
	},
	computed: {
		$tvc() {
			return this.$store.state.tvc;
		},
		// 籂選後的清單
		filterList() {
			let list = this.scriptList;
			if(this.selectTag) {
				list = list.filter(lis=>(lis.tags.indexOf(this.selectTag) != -1));
			}
			if(this.searchText) {
				list = list.filter(lis=>{
					let str = JSON.stringify(lis).toLowerCase();
					return str.indexOf(this.searchText.toLowerCase()) != -1;
				});
			}
			return list;
		},
		/** 指標清單 */
		scriptList() {
			let list = [];
			// tag物件清單
			let tagList = [];
			for(let key in this.totalList) {
				let scriptObj = this.totalList[key];
				let name = scriptObj.name || key;
				let value = key;
				let tags = scriptObj.tags;
				list.push({name: name, value: value, tags: tags});
				for(let idx in tags) {
					let tag = tags[idx];
					tagList.push(tag);
				}
			}
			this.tags = Array.from(new Set(tagList))
			return list;
		},
		/** 全部指標清單 */
		totalList() {
			return vuex.config.publicPdSetting.CONFIG.TVC.indicators;
		},
	},

}
</script>
<style scoped>
.icon-btn.close {
	cursor: pointer;
}
.title-ctn,.search-ctn,.label-name, .list-li{
	padding: 0.5em 1em;
	/* font-size: 0.8em; */
}
.indicator-selector-ctn{
	color: #ffffff;
	background: #1e222d;
    border: 0px solid #ffffff;
    border-radius: 6px;
}
.title-ctn {
	padding: 1em;
	font-size: 1em;
}
.lable-text {
	font-size: 1.2em;
	font-weight: bold;
}
.search-ctn {
	border-top:1px solid gray;
	border-bottom:1px solid gray;
}
.input-ctn{
	background: rgba(0,0,0,0);
	outline: none;
	border: none;
	caret-color: greenyellow;
	font-size: 1em;
	color: #ffffff;
	padding-left: 10px;
}
.tags-ctn {
    white-space: nowrap;
	margin-top: 0.5em;
}
.tag-row {
	margin: 0 0 0 1em;
}
.tag-item {
	padding: 0.4em 0.8em;
	height: 1.2em;
	border-radius: 1em;
	background: #ffffff;
	color: black;
	font-size: 0.8em;
	margin: 0.3em 0.5em 0.3em 0;
	cursor: pointer;
}
.tag-item:hover {
	background-color: rgba(255, 255, 255,0.5);
}
.tagfucus {
	background: #2962FF !important;
	color: #ffffff;
}
.list-ul li:hover {
	background: rgb(68, 255, 255);
}
.list-ul::-webkit-scrollbar{width: 2px;}
.list-ul:hover::-webkit-scrollbar{width: 6px;}
.list-ul::-webkit-scrollbar-track,.overflow-x-auto::-webkit-scrollbar-track {
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
	border-radius: 10px;
}
.list-ul::-webkit-scrollbar-thumb,.overflow-x-auto::-webkit-scrollbar-thumb {
	border-radius: 10px;
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
	background-color: #5542ff;
}
.list-li:hover {
	background-color: #292e3d;
}
.script-item{font-size: 0.8em;}
.overflow-x-auto::-webkit-scrollbar {height: 2px;}
.overflow-x-auto:hover::-webkit-scrollbar {height: 6px;}
.clr-gray {
	color: #B0B5BC !important;
}
.clr-gray2 {
	color: #909193 !important;
}
.posr {
	position: relative;
}
.overflow-x-auto {
	overflow-x: auto;
}
.overflow-y-auto {
	overflow-y: auto;
}
</style>