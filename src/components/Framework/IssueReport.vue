<template>
	<div class="flex-1 flex-col" :class="{'mgt3': isDesktop}" v-stop-propagation-y>
		<div class="flex-col flex-1 overflow-y-auto pdlr3">
			<SingleSelect :options="feedBackOptions" v-model="feedbackSelect"/>
			<div class="flex-col pdtb3">
				<div class="flex-row flex-start">
					<div>{{!title? $ln('请输入主题'): $ln('主题')}}</div>
					<div class="flex-1" />
					<span class="icon-btn tcef rd6 mgr2" :class="{'pd1':!isDesktop}" @click="title=''"><i class="material-icons font-size-little">cleaning_services</i></span>
				</div>
				<div class="flex-start">
					<input type="text" v-model="title" class="title w100p rd2 flex-start pd2" />
				</div>
			</div>
			<div class="flex-col pdtb3">
				<div class="flex-row flex-start">
					<div>{{!description? $ln('请说明'): $ln('说明')}}</div>
					<div class="flex-1" />
					<span class="icon-btn tcef rd6 mgr2" :class="{'pd1':!isDesktop}" @click="description=''"><i class="material-icons font-size-little">cleaning_services</i></span>
				</div>
				<div class="flex-start">
					<textarea v-model="description" class="description w100p h50vw rd2 flex-start font-size-normal"></textarea>
				</div>
			</div>
			<div class="flex-start" v-if="attachment && !showUploadImage">{{$ln("点击图形可编辑")}}</div>
			<div class="flex-1" v-if="!showUploadImage">
				<img :src="attachImageData" v-if="attachment" class="preview" @click="onImgClick"/>
			</div>
			<div class="flex-1 flex-col" v-if="enableUploadImage">
				<span>{{$ln('上传图片')}}</span>
				<div class="flex-1 flex-row pdt2">
					<div v-for="(pic, idx) in pickImageList" :key="idx" class="posr pd1">
						<i class="material-icons delete-btn bgc-up font-size-mini" @click="onDelPic(idx)">close</i>
						<img :src="pic.content" class="preview"/>
					</div>
					<span v-if="!pickImageList.length" class="font-size-mini">{{$ln('未选取')}}...</span>
				</div>
			</div>
		</div>
		<div class="flex-row pd3">
			<span class="icon-btn tcef rd6 mgr2 flex-center" v-if="enableUploadImage" @click="pickImage">
				<i class="material-icons font-size-large">image</i>
			</span>
			<div class="" v-if="!showUploadImage">
				<radio v-model="attachment" class="divider">
					<span value="true">{{$ln("附截图")}}</span>
					<span value="false">{{$ln("不附截图")}}</span>
				</radio>
			</div>
			<div class="flex-1" />
			<div class="flex-end">
				<Button v-if="!isPortrait" class="pdlr3 cbtn mgr3 nowrap" @click="onClose">{{$ln('关闭')}}</Button>
				<Button class="pdlr3 cbtn nowrap" @click="onSubmit">{{$ln('提交')}}</Button>
			</div>
		</div>
		<Paint v-model="attachImageData" v-if="isPreView && !isDesktop" @CLOSEPAINT="onImgClick" class="paint" />
	</div>
</template>
<script>
import Paint from '@/components/Framework/Paint.vue';
import IssueReport_ImageFn from '@/components/Framework/IssueReport_ImageFn.js';
export default {
	mixins: [IssueReport_ImageFn],
	data() {
		return {
			title: "",
			description: "",
			attachment: true,
			isPreView: false,
			feedbackSelect: "",
			// pickImageList: [],
		}
	},
	props:["param"],
	components: {Paint},
	mounted() {this.$emit('title', this.$ln('问题与建议'))},
	methods: {
		clearInput () {
			this.title = "";
			this.description = "";
		},
		// 預覽圖片
		onImgClick() {
			// 桌機版另外彈窗處理。
			if(this.isDesktop) {
				eventBus.$emit("POPUP-DIALOG", Paint, {value: this.attachImageData, save: this.changeImg});
			}
			else this.isPreView = !this.isPreView;
		},
		// 送出問題回報
		onSubmit() {
			if(!this.title){
				this.$store.state.notify({icon: `error`, body: "请输入或选择要回报的标题"});
				return;
			}
			if(this.attachmentFiles.length){
				M4C.AC.getAcToken(this.attachmentFiles.length);
				M4C.Issue.submitIssue({title: this.title, desc: this.description}, this.attachmentFiles);
			}
			else
				M4C.Issue.submitIssue({title: this.title, desc: this.description});
			this.cleanData();
			eventBus.$emit("CLOSE-DIALOG");
		},
		cleanData() {
			this.title = "";
			this.description = "";
			this.attachment = "";
			this.pickImageList = [];
		},
		// 桌機版的call back存圖片資料
		changeImg(data) {
			this.attachImageData = data;
		},
		onClose() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		onDelPic(idx) {
			this.pickImageList.splice(idx, 1);
		},
	},
	watch: {
		// 主題切換
		feedbackSelect(nv, ov){
			if(ov != nv){
				let data = this.feedBackData.find(fBD=> {return fBD.desc == nv});
				// 填入預設內容。
				if(data) {
					this.title = data.subject;
					this.description = data.desc;
				}
				// 没有預設內容就清空。
				else {
					this.clearInput();
				}
			}
		}
	},
	computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 截圖資料
		attachImageData: {
			get: function () {
				return M4C.Issue.catchScreenData;
			},
			set: function (newValue) {
				M4C.Issue.catchScreenData = newValue;
			}
		},
		// pdsetting功能清單。
		functionData() {
			return this.$store.state.wsConnMap.quote.acPdSetting.function;	
		},
		// 預設選項清單。
		feedBackData() {
			return this.functionData.feedback.options;
		},
		// 建立問題回報預設選項清單。
		feedBackOptions() {
			if(this.feedBackData){
				let options = this.feedBackData.map(fBD => {
						return {label: fBD.subject, value:fBD.desc};
				});
				options.unshift({label: this.$ln('新主题'), value:""});
				return options;
			}
		},
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		// 是否顯示上傳圖檔
		showUploadImage() {
			return this.param && this.param.showUploadImage;
		},
		// 是否啟用 新增問題回報 (需要 app 支持 window.imagePicker plugin)
		enableUploadImage() {
			return this.showUploadImage && window.imagePicker;
		},
		// 附帶圖檔清單
		attachmentFiles() {
			// 有截圖且同意附圖
			if(this.attachImageData && this.attachment){
				// 截圖資料、名稱
				let screenShotOjb = {
					name: M4C.Issue.catchScreenName,
					content: this.attachImageData,
				}
				return this.pickImageList.concat(screenShotOjb);
			}
			// 其他情況回傳圖片上傳清單
			return this.pickImageList;
		}
	}

}
</script>
<style scoped>
.title, .description{
	box-sizing: border-box;
}
.title {
	text-align: start;
}
textarea {
    resize: none;
}
.preview{
	box-sizing: border-box;
	width: 20vw;
}
.previewImg {
	position: absolute;
	left:10vw;
	right:10vw;
}
.paint {
	z-index: 2;
}
.delete-btn {
	position: absolute;
	right: 0;
	top: -0.2em;
	border-radius: 50%;
}
@media screen and (orientation: landscape) {
	.issue-report-ctn /deep/ .btn-default-ht-rd{
		height: 9.0vh;
   		border-radius: 2.1vh;
	}
	.pd2 {
		padding: 2vh;
	}
	.pdtb3 {
		padding-top: 3vh;
		padding-bottom: 3vh;
	}
	.h50vw {
		height: 50vh;
	}
	.issue-report-ctn /deep/ .radio-wrapper {
		height: 9vh;
		border-radius: 2vh;
	}
	.issue-report-ctn /deep/ .radio-wrapper>* {
		padding: 0 2.9vh;
	}
}
.desktop .description {
	min-height: 10em;
}
.desktop .previewImg {
	max-width: 100%;
	position: fixed;
	top: 10%;
}
</style>