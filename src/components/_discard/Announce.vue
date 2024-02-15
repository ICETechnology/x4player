<template>
    <div class="flex-col">
		<!-- 公告內容 -->
		<TabGroup v-if="tabList.length > 0" class="announce-tab-group" ref="tg" :selectedIdx="idx"
			:tabList="tabList" :hiddenTab="true" @onActiveTab="onTab" :tabKey="ranKey"/>
		<!-- 下方工具列 -->
		<div v-if="tabList.length > 0" class="foot pd3 flex-row">
			<Button class="flex-center btn-confirm pdr5 pdl2 posr" :class="{disabled: !hasPrev}" @click="onTabClick(--idx)">
				<i class="material-icons">arrow_left</i>{{$ln('上一则')}}
				<span v-if="hasPrevUnread" class="red-point" />
			</Button>
			<div class="flex-1 flex-center">
				<div v-if="unreadAnnounceCount > 0" class="clr-gray2 font-size-mini">{{$ln('仍有')}} {{unreadAnnounceCount}} {{$ln('则未读')}}</div>
			</div>
			<Button class="flex-center btn-confirm pdl5 pdr2 posr" :class="{disabled: !hasNext}" @click="onTabClick(++idx)">
				{{$ln('下一则')}}<i class="material-icons">arrow_right</i>
				<span v-if="hasNextUnread" class="red-point" />
			</Button>
		</div>
		<!-- 無公告 -->
		<div v-if="tabList.length===0" class="flex-1 posr">
			<Stamp stampStatus="NO_ANNOUNCE" :ignoreLogin="true" />
		</div>
    </div>
</template>

<script>
import AnnounceContent from "@/components/AnnounceContent.vue";
export default {
	props: [],
	data() {
		return {
			ranKey: ''.random(),
			idx: 0,
			queryAnnListResult: {},
		}
	},
	beforeMount() {
		// ExtraMenu 中帶有公告項目時，才啟用公告功能
		if (this.enableAnnounce) {
			// 查詢公告列表
			this.queryAnnListResult = M4C.Announce.queryAnnList();
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {AnnounceContent},
    methods: {
		onTab(obj) {
			let annObj = obj.tab.param;
			if (annObj) {
				this.idx = obj.idx;
				this.readOne();
			}
		},
		readOne() {
			let annObj = this.announceList[this.idx];
			if (annObj) {
				this.$emit('title', annObj.s);
				if (!annObj.isRead)
					M4C.Announce.readAnn(annObj._id);
			}
		},
		onTabClick(idx) {
			if (this.$refs.tg)
				this.$refs.tg.onTabClick(idx);
		},
	},
	watch: {
		// 公告列表查詢完成
		'queryAnnListResult.$STATUS'(nv) {
			if (nv === "DONE") {
				// 找最前面一則未讀
				this.idx = this.announceList.findIndex(o=>!o.isRead);
				// 若沒有未讀則切到最後一則
				this.idx = this.idx === -1 ? this.announceList.length - 1 : this.idx;
				this.readOne();
			}
		}
	},
    computed: {
		tabList() {
			return this.$store.state.data.announceList.map((obj)=>{
				return {
					comClass: AnnounceContent,
					label: AnnounceContent.s,
					param: obj,
				};
			});				
		},
		announceList() {
			return this.$store.state.data.announceList;
		},
		selectedAnnounce() {
			return this.announceList[this.idx];
		},
		/** 有上一则 */
		hasPrev() {
			return this.idx > 0;
		},
		/** 有下一则 */
		hasNext() {
			return this.idx < this.announceList.length - 1;
		},
		/** 上一則之前有包含未讀 */
		hasPrevUnread() {
			if (this.hasPrev) {
				let list = this.announceList.slice(0, this.idx);
				return !!list.find(o=>!o.isRead);
			}
		},
		/** 下一則之後有包含未讀 */
		hasNextUnread() {
			if (this.hasNext) {
				let list = this.announceList.slice(this.idx+1);
				return !!list.find(o=>!o.isRead);
			}
		},
		/** 更多 */
		extraMenu() {
			return this.$store.state.config.quotePdSetting.function.extramenu;
		},
		/** 啟用公告 */
		enableAnnounce() {
			return !!this.extraMenu.items.find(o=>o.action==='announcement');
		},
		/** 未讀公告數 (打开公告后，公告未读数由公告元件更新) */
		unreadAnnounceCount() {
			let cnt = 0;
			try{cnt = this.$store.state.data.announceList.filter(o=>!o.isRead).length;}catch(err){}
			return this.$store.state.data.announceUnreads = cnt;
		},
	},
}
</script>

<style scoped>
.announce-tab-group {
	background-color: white;
}
.btn-confirm {
	width: auto;
	min-width: auto !important;
	height: 10vw;
	border-radius: 2vw;
}
.desktop .btn-confirm {
	width: 6em !important;
}
.red-point {
	position: absolute;
	top: -2px;
	right: -2px;
	width: 10px;
	height: 10px;
	border-radius: 10px;
	border: 1px solid white;
	background-color: red;
}
</style>