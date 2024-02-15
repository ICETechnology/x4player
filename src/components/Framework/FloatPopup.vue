<template>
	<div class="mask" v-if="isPopup">
		<float-popup-wrapper v-if="subPopup">
			<slot></slot>
			<Button v-if="isBtn" @click="$emit('close')"><i class="material-icons">keyboard_arrow_down</i></Button>
		</float-popup-wrapper>
	</div>
</template>
<script>
import FloatPopupWrapper from "@/components/Framework/FloatPopupWrapper.vue";
import Button from "@/components/Framework/Button.vue";
export default {
	data() {
		return {
			isPopup: false,
			subPopup: false,
			isTrans: false
		};
	},
	watch: {
		isFloat: function(v) {
			this.isPopup = v || this.isPopup;
			if (!this.isTrans) {
				this.subPopup = v;
				this.isTrans = true;
			}
			this.setPopup(v);
		}
	},
	props: ["isFloat", "isBtn"],
	components: { "float-popup-wrapper": FloatPopupWrapper, "Button": Button},
	mounted() {
		//根據props帶入的參數設定預設值
		this.isPopup = this.isFloat;
		this.subPopup = this.isFloat;
	},
	methods: {
		setPopup(v) {
			let self = this;
			//延遲執行改變
			if (this.transObj) {
				clearTimeout(this.transObj);
			}
			this.transObj = setTimeout(function() {
				if(self.subPopup != v){
					//內容過場動畫還需要執行，所以指派新的值，並再呼叫一次method，
					self.subPopup = v;
					self.setPopup (v);
				}
				else{
					//無需處理新的過場，消滅wrapper，並結束過場動畫。
					self.isPopup = v;
					self.isTrans = false;
				}
				self.transObj = null;
			}, 300);
		}
	}
};
</script>
<style scoped>
.mask {
	overflow: hidden;
	width: 100%;
	position: absolute;
	bottom: 0;
}
.wrapper {
	width: 100%;
	background-color: #333;
	/* transform: translateY(100%);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1); */
}
.show-float {
	transform: translateY(0);
}
</style>