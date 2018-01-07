import mergeData from 'vuikit/core/helpers/vue-data-merge'

const sizes = ['large', 'small']
const styles = ['default', 'primary', 'secondary', 'danger', 'text', 'link']

export default {
  functional: true,
  props: {
    active: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'default',
      validator: style => styles.indexOf(style) !== -1
    },
    size: {
      type: String,
      validator: size => !size || sizes.indexOf(size) !== -1
    },
    htmlType: {
      type: String,
      default: 'button'
    }
  },
  render (h, { data, props, children }) {
    const { disabled, type, size, active, htmlType } = props

    const def = {
      attrs: {
        type: htmlType,
        disabled
      },
      class: ['uk-button', `uk-button-${type}`, {
        'uk-active': active,
        [`uk-button-${size}`]: size
      }]
    }

    return h('button', mergeData(data, def), [
      children
    ])
  }
}
