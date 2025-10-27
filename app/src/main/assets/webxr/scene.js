AFRAME.registerComponent('open-chatgpt-on-click', {
  init: function () {
    this.el.addEventListener('click', function () {
      window.location.href = 'https://chat.openai.com/';
    });
  }
});

AFRAME.registerComponent('button-hover', {
  schema: {
    color: {type: 'color', default: '#2563eb'},
    hoverColor: {type: 'color', default: '#3b82f6'}
  },
  init: function () {
    const el = this.el;
    const material = el.getAttribute('material') || {};
    const baseColor = material.color || this.data.color;
    const hoverColor = this.data.hoverColor;

    el.addEventListener('mouseenter', function () {
      el.setAttribute('material', 'color', hoverColor);
    });

    el.addEventListener('mouseleave', function () {
      el.setAttribute('material', 'color', baseColor);
    });
  }
});
