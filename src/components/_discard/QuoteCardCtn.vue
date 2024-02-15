<template>
    <ScrollBounce class="quote-contracts-ctn FULL" v-observe-visibility="visibilityChanged">
		<div class="visibility-ctn" v-if="isVisible">
			<QuoteCard v-for="sid in cls.param" :sid="sid" :key="sid" :isVisible="isVisible" :active="cls.active"></QuoteCard>
		</div>
    </ScrollBounce>
</template>

<script>
import ScrollBounce from "@/components/Framework/ScrollBounce.vue";
import QuoteCard from "./QuoteCard.vue";

export default {
	props: ['cls'],
	data() {
		return {
			isVisible: false,
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
		ScrollBounce,
		QuoteCard,
	},
    methods:{
        visibilityChanged(isVisible, entry) {
            if (isVisible === this.isVisible) return;
            console.debug(`QuoteCardCtn [${this.cls.label}] isVisible`, isVisible);
            this.isVisible = isVisible;
		},
	},
	watch: {
	},
    computed: {
    }
}
</script>

<style>
.quote-contracts-ctn {
	/* has to be scroll, not auto */
	overflow-y: scroll;
	/* ios scrolling 优化 */
	-webkit-overflow-scrolling: touch;
}
.visibility-ctn {

}
</style>