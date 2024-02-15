<!-- 這是一個幫忙做訂閱指定合約的組件，透過組件存滅機制來幫忙訂閱/解除訂閱商品，例如 PositionCard 想要訂閱其標的商品時) -->
<template>
    <div class="sub-contract-ctn hidden"/>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	props: ['sid'],
}
</script>
