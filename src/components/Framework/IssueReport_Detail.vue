<template>
	<div class="flex-1 flex-col pdlr3" v-stop-propagation-y>
		<div class="flex-col flex-1 overflow-y-auto">
			<div class="flex-row pdtb2">
				<div class="pdr2 clr-gray2">{{$ln('回报单号')}}：</div>
				<div class="flex-1 flex-start">{{issueId}}</div>
			</div>
			<div class="flex-row pdtb2">
				<div class="pdr2 clr-gray2">{{$ln('处理状态')}}：</div>
				<div class="flex-1" v-if="issueData">{{$ln(statusMap[issueData.status])}}</div>
			</div>
			<div class="flex-row pdtb2">
				<div class="pdr2 clr-gray2">{{$ln('更新时间')}}：</div>
				<div class="flex-1 flex-start" v-if="issueData">{{parseTime(issueData.updated_at)}}</div>
			</div>
			<div class="flex-col pdtb2 subject-ctn">
				<div class="clr-gray2">{{$ln('主题')}}：</div>
				<div v-if="issueData">
					{{issueData.title}}
				</div>
			</div>
			<div class="flex-col pdtb2 desc-ctn">
				<div class="clr-gray2">{{$ln('说明')}}：</div>
				<div v-if="issueData">
					{{issueData.desc}}
				</div>
			</div>
			<div class="flex-col pdtb2 flex-1 msg-content">
				<div class="pdr2 pdb1 clr-gray2">{{$ln('留言记录')}}：</div>
				<div class="flex-1 flex-col posr" ref="msg" >
					<div class="FULL divider rd2 pdtb2 msg-ctn overflow-y-auto" v-stop-propagation-y>
						<div class="flex-col pd1 msg-item" v-for="(msg, idx) in megHistory" :key="idx">
							<div class="clr-gray2 font-size-mini" :class="{'flex-end': !msg.mngr}">{{parseTime(msg.timestamp)}}</div>
							<div class="flex-row" :class="{'row-reverse': !msg.mngr}">
								<div v-if="msg.mngr" class="mgr1">
									<span class="bgc-filled rd2 pd1">{{$ln('客服')}}</span>
								</div>
								<div v-if="!msg.mngr" class="mgl1">
									<span class="bgc-P rd2 pd1">{{$ln('我')}}</span>
								</div>
								<div class="flex-1" :class="{'flex-end': !msg.mngr}">
									{{msg.comment}}
								</div>
							</div>
						</div>
					</div>
					<div class="new-msg font-size-micro" v-if="!is_read">{{$ln("新留言")}}</div>
				</div>
			</div>
		</div>
		<div class="flex-row pdtb2 ">
			<div class="icon-btn rd6 mgr2 flex-center posr" v-if="enableUploadImage">
				<span class="tcef" v-if="!isLoading" @click="pickImage">
					<i class="material-icons font-size-large">image</i>
				</span>
				<LoadingIcon v-if="isLoading" />
			</div>
			<input type="text" class="rd2 mgr2 flex-1" v-model.lazy="comment" @click="updateRead"/>
			<Button class="pdlr2" @click="onSubmitMsg">{{$ln('送出')}}</Button>
		</div>
	</div>
</template>
<script>
import IssueReport_ImageFn from '@/components/Framework/IssueReport_ImageFn.js';
var VueScrollTo = require('vue-scrollto');
export default {
	mixins: [IssueReport_ImageFn],
	data() {
		return {
			comment: "",
			statusMap: {10: "處理中", 20: "已處理", 100: "結案"},
			isLoading: false,
			pickTimeout: "",
		}
	},
	props:['param'],
	mounted(){
		// 未讀狀態改為已讀
		if(!this.is_read)
			M4C.Issue.setReaded({id: this.issueId, vs: this.issueVs});
		// 重查問題回報資料(當前明細另外儲存，避免遇到未讀、全部清單資料沒有當前明細資料的情形導致後續可能的更新問題。)
		M4C.Issue.currentIssue = this.param.issueData;
		M4C.Issue.getIssue(this.issueId);
		// 查詢未讀清單
		M4C.Issue.queryUnreadMsg();
	},
	beforeDestroy() {
		M4C.Issue.currentIssue = {};
	},
	methods: {
		onSubmitMsg() {
			// 未填入留言不做處理。
			if(!this.comment) return;
			// 新增留言
			M4C.Issue.addIssueCmt({id: this.issueId, comment: this.comment});
			this.comment = "";
		},
		parseTime(time){
			return new Date(time).dayTime18();
		},
		updateRead() {
			if(!this.issueData.is_read)
				M4C.Issue.setReaded({id: this.issueData._id, vs: this.issueData._vs});
		},
		scrollBot() {
			let list = this.$refs.msg.getElementsByClassName('msg-item');
			let target = list[list.length-1];
			VueScrollTo.scrollTo(target, 200, {
					container: ".msg-ctn",
					x: false,
					y: true,
			});
		}
	},
	watch: {
		is_read(nv) {
			if(!nv) {
				this.scrollBot();
			}
		},
		pickImageList(nv, ov) {
			// 清除延遲時間
			if(this.pickTimeout)
				clearTimeout(this.pickTimeout);
			// 沒有檔案列表或檔案列表被清空時不處理。
			if(!nv.length) return;
			let self = this;
			this.isLoading = true;
			this.pickTimeout = setTimeout(() => {
				self.$store.state.notify({
					icon: `check_circle`,
					head: `问题回报`,
					body: `准备上传檔案中...`,
				});
				// 跟ac要等量的token資料。
				M4C.AC.getAcToken(nv.length);	
			}, 500);			
		},
		acTokenList(nv, ov) {
			if(nv.length && this.pickImageList.length) {
				// 依序上傳檔案
				for(let i = 0; i< nv.length; i++) {
					M4C.Issue.uploadFile(this.issueId, this.pickImageList[i].content, nv[i], this.pickImageList[i].name);
				}
				// 在留言記錄中記錄上傳檔案事件。
				M4C.Issue.addIssueCmt({id: this.issueId, comment: `${this.$ln('已上传檔案')}${this.pickImageList.length}${this.$ln('个')}`});
				this.pickImageList.splice(0);
				this.isLoading = false;
			}
		}
	},
	computed: {
		issueId() {
			return this.param.issueData._id;
		},
		issueVs() {
			return this.param.issueData._vs;
		},
		// 回報資料
		issueData() {
			return M4C.Issue.currentIssue;
		},
		// 留言記錄
		megHistory() {
			if(this.issueData)
				return this.issueData.comments;
		},
		// 是否已讀
		is_read() {
			if(this.issueData)
				return this.issueData.is_read;
		},
		// 當前頁面所有資料
		allIssueReportList() {
			return this.issuePageData.data;
		},
		// 問題回報完整資料(含頁面資訊)
		issuePageData() {
			if(this.param.type == 'unread')
				return this.$store.state.data.issueUnreadData;
			else
				return this.$store.state.data.issueData;
		},
		// 是否啟用 手機圖檔上傳(需要 app 支持 window.imagePicker plugin)
		enableUploadImage() {
			return window.imagePicker;
		},
		acTokenList() {
			return M4C.AC.acToken;
		}
	}

}
</script>
<style scoped>
.desc-ctn {
	min-height: 20vw;
	max-height: 20vw;
	overflow-y: scroll;
}
.new-msg {
	position: absolute;
	bottom: 0;
	background-color: rgba(0,0,0,0.5);
}
.desktop .desc-ctn {
	min-height: 4em;
	max-height: 4em;
	overflow-y: scroll;
}
.msg-content {
	min-height: 10em;
}
.icon-btn {
	min-width: 1.2em;
}
</style>