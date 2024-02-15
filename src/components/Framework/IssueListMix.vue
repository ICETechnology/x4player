<template>
	<div class="issue-list-ctn flex-1 flex-col">
		<TabGroup :tabList="infoTabList" tab-key="MIX-ISSUE-LIST" class="flex-1 mix-issue-list-ctn" @onActiveTab="onActiveTab"></TabGroup>
		<div v-if="enableCreateIssue" class="pd4">
			<Button class="iceben pdtb2" @click="createIssue">{{$ln('新增问题回报')}}</Button>
		</div>
	</div>
</template>
<script>
import IssueReportList from "@/components/Framework/IssueReportList.vue";
import IssueReportUseSpec from "@/components/Framework/IssueReportUseSpec.vue";
import IssueReport from "@/components/Framework/IssueReport.vue";
export default {
	data() {
		return {
			infoTabList : [
				{"label": "未读", "comClass": IssueReportList, param: {type: "unread"}, "selected": true},
				{"label": "全部", "comClass": IssueReportList, param: {type: "all"}},	
				{"label": "使用说明", "comClass": IssueReportUseSpec},	
			],	
		}
	},
	beforeMount(){
		// 查詢未讀
		M4C.Issue.queryIssue({isRead: false, page: 1});
		// 查詢全部
		M4C.Issue.queryIssue({page: 1});
	},
	methods: {
		onActiveTab(obj) {
			let tabData = obj.tab;
			if(tabData.param && tabData.param.type == "unread") {
				M4C.Issue.queryIssue({isRead: false, page: 1});
			}
			else if(tabData.param && tabData.param.type == "all") {
				M4C.Issue.queryIssue({page: 1});
			}
		},
		// 新增問題回報
		createIssue() {
			eventBus.$emit("POPUP-DIALOG", IssueReport, {showUploadImage: true}, {$HEAD: {title: this.$ln(`问题与建议`)}, transName: 'float'});
		},
	},
	watch: {},
	computed: {
		tabList() {
			if(this.hasUnreadMsg){
				return this.infoTabList;
			}
			else 
				return [{"label": "全部", "comClass": IssueReportList},{"label": "使用说明", "comClass": IssueReportUseSpec}];	
		},
		hasUnreadMsg() {
			return M4C.Issue.unReadMsg;
		},
		// 是否啟用 新增問題回報 (需要 app 支持 window.imagePicker plugin)
		enableCreateIssue() {
			return window.imagePicker;
		},
	}

}
</script>
<style scoped>
.mix-issue-list-ctn /deep/ .head {
	background-color: rgb(37, 52, 69);
	border-bottom: 1px solid #EAEAEA;
}
.mix-issue-list-ctn /deep/ .head .tab {
	padding: 0;
}
.mix-issue-list-ctn /deep/ .body .divider-bottom{
	border-bottom: 1px solid #7E8185;
}
</style>