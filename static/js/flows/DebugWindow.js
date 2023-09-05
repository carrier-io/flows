const export1 = {
  "drawflow": {
    "Home": {
      "data": {
        "1": {
          "id": 1,
          "name": "search",
          "data": {
            "embedding": 2,
            "options": {
              "properties_open": true
            }
          },
          "class": "flow_node",
          "html": "search",
          "typenode": "vue",
          "inputs": {
            "input_1": {
              "connections": [
                {
                  "node": "2",
                  "input": "output_1"
                }
              ]
            }
          },
          "outputs": {
            "output_1": {
              "connections": []
            }
          },
          "pos_x": 115,
          "pos_y": 162
        },
        "2": {
          "id": 2,
          "name": "start",
          "data": {
            "variables": [
              {
                "name": "var1",
                "type": 0,
                "value": "qwerty"
              }
            ],
            "options": {
              "properties_open": false
            }
          },
          "class": "flow_node",
          "html": "start",
          "typenode": "vue",
          "inputs": {},
          "outputs": {
            "output_1": {
              "connections": [
                {
                  "node": "1",
                  "output": "input_1"
                }
              ]
            }
          },
          "pos_x": 113,
          "pos_y": 15
        }
      }
    }
  }
}

function customStringify(obj) {
  let cache = [];
  let str = JSON.stringify(obj, function(key, value) {
      if (key === 'parent') {
          return null
      }
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  }, 2);
  cache = null; // reset the cache
  return str;
}


const DebugWindow = {
    data() {
      return {
          ta_1: JSON.stringify(export1),
          e_state: ''
      }
    },
    mounted() {
       window.dw = this
    },
    computed: {
        editor() {
            return this.$root.registered_components.DrawFlowStuff?.editor
        }
    },
    methods: {
        getOutput() {
            this.ta_1 = JSON.stringify(this.editor.export(), null, 2)
        },
        handleImport() {
            this.editor.import(JSON.parse(this.ta_1))
        }
    },
    template: `
<div class="card side-window">
    <pre class="tmp-helper">DebugWindow.js</pre>
    <div class="card-header d-flex">
        <div class="flex-grow-1 font-h4 font-bold">
        </div>
        <div>
        </div>
    </div>
    <div class="d-flex flex-column">
        <div class="">
            <button class="btn" @click="getOutput">export</button>
            <button class="btn" @click="handleImport">import</button>
            <button class="btn" @click="editor.clear()">clear</button>
            <button class="btn" @click="e_state = window.customStringify(editor)">get editor state</button>
        </div>
        <textarea class="flex-grow-1" v-model="ta_1"></textarea>
        <textarea class="flex-grow-1">{{ e_state }}</textarea>
    </div>
</div>
`
}
