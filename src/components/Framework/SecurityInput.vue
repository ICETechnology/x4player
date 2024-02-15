<template>
	<div class="security-input-ctn">
		<input :type="passwordVisible ? 'text' : 'password'" class="input-field" v-model="localValue" @input="handleInput" :placeholder="placeholder" />
		<i class="material-icons" @click="toggleVisibility">{{passwordVisible ? "visibility_off" : "visibility"}}</i>
	</div>
</template>

<script>
export default {
	props: ['value', 'placeholder'],
	data() {
		return {
			passwordVisible: false,
			localValue: this.value,
		};
	},
	methods: {
		toggleVisibility() {
			this.passwordVisible = !this.passwordVisible;
		},
		handleInput(event) {
			this.localValue = event.target.value; // 更新本地数据属性
			this.$emit('input', this.localValue); // 通知父组件更改
		},
	},
	watch: {
		value(nv) {
			this.localValue = nv;
		},
	},
};
</script>

<style scoped>
.security-input {
	position: relative;
	display: inline-block;
}

.input-field {
	height: 9vw;
    border: 0;
    padding: 0 15px;
	padding-right: 30px;
    border-radius: 2vw;	
}

.material-icons {
	color: gray;
	position: absolute;
	right: 10px;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
}
</style>
