<template>
    <div class="flex-col announce-ctn">
		<div class="announce-tab-group flex-row overflow-x-auto" v-stop-propagation-x>
			<div class="announce-tab flex-row flex-center pdlr3" v-for="(lvl, idx) in $store.state.data.announceClassify" :key="idx" >
				<div class="flex-col flex-center tcef" @click="announceClassify=idx">
					<span class="flex-center announce-tab-name ht1 pd1 nowrap" :class="{'clr-orange2': idx==announceClassify}">
						{{$ln(`announceClassify_${idx}`)}}</span>
					<span class="flex-center focus-line" :class="{focus: idx==announceClassify}" />
				</div>
				<div class="unread-unm-icon flex-center bgc-up pdlr1 font-size-small" v-if="getUnreadQty(idx)">{{getUnreadQty(idx)}}</div>
			</div>
		</div>
		<!-- 公告內容 -->
		<AnnounceContent class="flex-1 clr-white" :param="annouceContentParam" v-if="showAnnounceContent" />
		<!-- 無公告顯示 -->
		<div class="flex-1 clr-white flex-center posr" v-if="!annouceContentParam">
			<Stamp stampStatus="NO_MONTH_ANNOUNCE" :ignoreLogin="true" />
		</div>
		<!-- 月份切換 -->
		<AnnounceSwitch class="announce-switch-ctn pdtb2 font-size-micro" :optList="optList" v-model="currentMonth" v-if="currentAnnounceList.length > 0"/>
		<!-- 月內公告列表 -->
		<div class="month-list-ctn posr" v-if="currentAnnounceList.length > 0">
			<ScrollBounce class="FULL" v-stop-propagation-y>
				<div class="monthList-ctn flex-col" >
					<div class="ann-row flex-col flex-1 pdtb2 pdlr4 font-size-small" 
						:class="{'clr-orange': annouceContentParam.updated_at == dayAnnounce.updated_at}"
						v-for="(dayAnnounce, idx) in monthAnnounceList" :key="idx" @click="onAnnounceClick(dayAnnounce)">
						<div class="flex-start flex-row date-ctn">
							<!-- 更新時間 -->
							<span class="pdtb1">{{covertMDT(dayAnnounce.updated_at)}}</span>
							<span class="flex-1" />
							<!-- 未讀標籤 -->
							<span v-if="!dayAnnounce.isRead" class="point-icon clr-up border-B font-size-micro">{{$ln('未读')}}</span>
							<!-- 已讀標籤 -->
							<span v-if="dayAnnounce.isRead" class="point-icon clr-gray3 border-gray font-size-micro">{{$ln('已读')}}</span>
						</div>
						<!-- 公告標題 -->
						<div class="flex-start flex-1">{{dayAnnounce.s}}</div>
					</div>
				</div>
			</ScrollBounce>
		</div>
		<!-- 無公告 -->
		<div v-if="currentAnnounceList.length == 0" class="flex-1 posr">
			<Stamp :stampStatus="queryAnnListResult.$STATUS" :ignoreLogin="true" />
		</div>
    </div>
</template>

<script>
import AnnounceContent from "@/components/AnnounceContent.vue";
import AnnounceSwitch from "@/components/AnnounceSwitch.vue";
export default {
	props: ["param"],
	data() {
		return {
			ranKey: ''.random(),
			idx: 0,
			queryAnnListResult: {},
			annouceContentParam: {},
			currentMonth: "",
			optList: {},
			showAnnounce: false,
			announceClassify: '0',
		}
	},
	beforeMount() {
		// ExtraMenu 中帶有公告項目時，才啟用公告功能
		if (this.enableAnnounce) {
			// 查詢公告列表
			this.queryAnnListResult = M4C.Announce.queryAnnList();
		}
		if(this.propsAnnouce) {
			console.log('propsAnnouce');
			this.announceClassify = this.propsAnnouce.$lvl;
			// 以公告有效日當日期// 取年月
			let Ym = new Date(this.propsAnnouce.updated_at).day8().substr(0,6);
			// 取年月
			this.currentMonth = Ym;
			this.annouceContentParam = this.propsAnnouce;
		}
	},
	beforeDestroy() {},
	components: {AnnounceContent, AnnounceSwitch},
    methods: {
		onAnnounceClick(announce) {
			this.annouceContentParam = announce;
		},
		covertMDT(date){
			let dd = new Date(date).dayTime18();
			return `${new Date(date).getMonth()+1}${dd.substr(7)}`;
		},
		getUnreadQty(lvl) {
			let list = this.$store.state.data.announceClassify[lvl].filter(ann=>!ann.isRead);
			return list.length;
		}
	},
	watch: {
		// 公告列表查詢完成
		'queryAnnListResult.$STATUS'(nv) {
			if (nv === "DONE") {
				console.log('announce queryAnnListResult.$STATUS done');
				this.currentAnnounceList.forEach((ann, idx)=> {
					// 以公告有效日當日期// 取年月
					let Ym = new Date(ann.updated_at).day8().substr(0,6);
					// 依年月區分
					if(!this.optList[Ym]) this.$set(this.optList, Ym, []);
					this.optList[Ym].push(ann);
				});
			}
			if (nv === "QUERY") {
				this.optList = {};
			}
		},
		currentMonth(nv, ov) {
			if(nv)
				this.annouceContentParam = this.monthAnnounceList[0] || this.propsAnnouce || {};
		},
		// 公告未讀數(有變動時更新未讀數字)
		unreadAnnounceCount(nv) {
			this.$store.state.data.announceUnreads = nv;
		},
		announceClassify(nv) {
			this.optList = {};
			this.currentAnnounceList.forEach((ann, idx)=> {
				// 以公告有效日當日期// 取年月
				let Ym = new Date(ann.updated_at).day8().substr(0,6);
				// 依年月區分
				if(!this.optList[Ym]) this.$set(this.optList, Ym, []);
				this.optList[Ym].push(ann);
			});
			this.currentMonth = Object.keys(this.optList).slice(-1)[0] || this.currentMonth;
			this.annouceContentParam = this.monthAnnounceList[0] || this.propsAnnouce || {};
		},
	},
    computed: {
		currentAnnounceList () {
			return this.$store.state.data.announceClassify[this.announceClassify] || [];
		},
		announceList() {
			return this.$store.state.data.announceList;
		},
		monthAnnounceList() {
			// 置頂公告列表
			let top_ann_list = [];
			// 一般公告列表
			let list = [];
			// 有公告時才處理。
			if(this.optList[this.currentMonth] && this.optList[this.currentMonth].length) {	
				// 依更新時間排序(新到舊)
				this.optList[this.currentMonth].sort((a, b)=>{
					return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
				});
				this.optList[this.currentMonth].forEach(ann => {
					// 置頂公告處理
					if(ann.pin)
						top_ann_list.push(ann);
					// 一般公告處理
					else list.push(ann);
				});
				// 回傳置頂與一般公告合併列表
				return top_ann_list.concat(list);
			}
			return list;
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
			if(this.announceList.length) {
				return this.announceList.filter(o=>!o.isRead).length;
			}
			else return 0;
		},
		/** 是否顯示公告內容元件 */
		showAnnounceContent() {
			// 有公告資料且有內容時才顯示。
			return this.announceList.length > 0 && this.annouceContentParam !== undefined;
		},
		propsAnnouce() {
			try {
				return this.param.announce;
			} catch (e) {

			}
		}
	},
}
</script>

<style scoped>
.ann-row {
	height: 3.5em;
}
.ann-row:nth-child(even){
	background: #17202A;
}
.month-list-ctn {
	height: 30%;
}
.announce-ctn /deep/ .announce-content {
	background-color: #17202A;
}
.announce-switch-ctn {
	background-color: #2A2A2A;
}
.point-icon {
	padding: 1px 1em;
	border-radius: 1em;
}
.announce-tab-name {
	line-height: 1;
	min-width: 4em;
}
.focus-line {
	width: 3em;
	border-bottom: 0.2em solid rgba(0,0,0,0);
}
.focus{
	border-color: orange;
}
.unread-unm-icon{
	border-radius: 1em;
	margin-bottom: 0.2em;
}
</style>