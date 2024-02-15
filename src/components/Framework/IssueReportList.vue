<template>
	<div class="issue-list-ctn flex-1 flex-col">
		<div class="flex-row head sys-bgc zindex-1 font-size-small pdlr2 divider-bottom pdtb1">
			<div class="cell1 flex-start clr-gray2">{{$ln(`建立时间`)}}</div>
			<div class="cell2 flex-start clr-gray2 flex-1 pdlr1">{{$ln(`主题`)}}</div>
			<div class="cell3 flex-start clr-gray2">{{$ln(`状态`)}}</div>
		</div>
		<div class="flex-1 posr font-size-small" v-stop-propagation-y>
			<ScrollBounce ref="sb" class="FULL" :status="stampStatus">
				<div v-for="(is, id) in allIssueReportList" :key="id" class="flex-row pd2 tcef" @click="onIssueClick(is)">
					<div class="cell1 flex-start">{{updateTime(is.created_at)}}</div>
					<div class="cell2 flex-start flex-1 pdlr1">{{is.title}}</div>
					<div class="cell3 flex-start posr">
						{{$ln(statusMap[is.status])}}
						<span class="material-icons clr-up pdl2 unread-icon md-10" v-if="!is.is_read">markunread</span>
					</div>					
				</div>
				<Stamp v-if="allIssueReportList && allIssueReportList.length===0" :stampStatus="stampStatus" :ignoreLogin="true"/>
			</ScrollBounce>
		</div>
		<div class="flex-row space-around pdb2" v-if="pageInfo && (pageInfo.pg != 1 || pageInfo.hn)">
			<Button class="btn btn-cancel" @click="onPrePage" :class="{disabled: pageInfo.pg == 1}">
				<i class="material-icons md-24 mgr1">expand_less</i>{{$ln('上一页')}}
			</Button>
			<Button class="btn btn-cancel" @click="onNextPage" :class="{disabled: !pageInfo.hn}">
				<i class="material-icons md-24 mgr1">expand_more</i>{{$ln('下一页')}}
			</Button>
		</div>
	</div>
</template>
<script>
import IssueReportDetail from "@/components/Framework/IssueReport_Detail.vue";
export default {
	data() {
		return {
			statusMap: {10: "處理中", 20: "已處理", 100: "結案"}
		}
	},
	props:['param'],
	mounted(){
		// this.getPage(1)
		// M4C.Issue.queryIssue({page: 1});
	},
	methods: {
		getPage(page) {
			if(this.category == "unread")
				M4C.Issue.queryIssue({isRead: false, page: page});
			else M4C.Issue.queryIssue({page: page});
		},
		onPrePage() {
			this.getPage(this.pageInfo.pg - 1)
			// M4C.Issue.queryIssue({page: this.pageInfo.pg - 1});
		},
		onNextPage() {
			this.getPage(this.pageInfo.pg + 1)
			// M4C.Issue.queryIssue({page: this.pageInfo.pg + 1});
		},
		updateTime(time) {
			return new Date(time).dayTime18();
		},
		onIssueClick(is) {
			eventBus.$emit("POPUP-DIALOG", IssueReportDetail, {issueData: is, type: this.category}, {'$HEAD': {'title': '回报内容'}, transName: 'float'});
		},
	},
	watch: {},
	computed: {
		issuePageData() {
			if(this.category == "unread")
				return this.$store.state.data.issueUnreadData;
			else if(this.category == "all")
				return this.$store.state.data.issueData;
		},
		pageInfo() {return this.issuePageData.pager;},
		/** 所有問題回報 */
		allIssueReportList() {
			if(this.category == "unread" && this.issuePageData.data)
				return this.issuePageData.data.filter(isData => {return isData.is_read === false});
			else if(this.category == "all" && this.issuePageData.data)
				return this.issuePageData.data;
			else return [];
		},
		/** 重查狀態章 */
		stampStatus() {
			return this.$store.state.result.queryIssueResult.$STATUS;
		},
		category(){
			if(this.param)
				return this.param.type;
		},
	}

}
</script>
<style scoped>
/* 寬度設定 */
.issue-list-ctn .cell1 {width: 25vw; max-width: 25vw;}
/* .issue-list-ctn .cell2 {width: 40vw; max-width: 40vw;} */
.issue-list-ctn .cell3 {width: 20vw; max-width: 20vw;}
.unread-icon{
	position: absolute;
	right: 0;
	top: 0;
	pointer-events: none;
}
.desktop .issue-list-ctn .cell1 {width: 5em; max-width: 5em;}
.desktop .issue-list-ctn .cell3 {width: 4em; max-width: 4em;}
.desktop .tcef:hover {
	color: aqua;
    background-color: #555;
    cursor: pointer;
}
</style>