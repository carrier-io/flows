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
                "type": "string",
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
const export2 = {
  "drawflow": {
    "Home": {
      "data": {
        "1": {
          "id": 1,
          "name": "start",
          "data": {
            "variables": []
          },
          "class": "flow_node",
          "html": "start",
          "typenode": "vue",
          "inputs": {},
          "outputs": {
            "output_1": {
              "connections": [
                {
                  "node": "2",
                  "output": "input_1"
                }
              ]
            }
          },
          "pos_x": 186,
          "pos_y": 34
        },
        "2": {
          "id": 2,
          "name": "prompt",
          "data": {
            "flow_handle_settings": {
              "on_success": "",
              "on_failure": 'stop',
              "log_results": false
            },
            "variables": [],
            "prompt_input": ""
          },
          "class": "flow_node",
          "html": "prompt",
          "typenode": "vue",
          "inputs": {
            "input_1": {
              "connections": [
                {
                  "node": "1",
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
          "pos_x": 184,
          "pos_y": 188
        }
      }
    }
  }
}
const export3 = {
  "drawflow": {
    "Home": {
      "data": {
        "1": {
          "id": 1,
          "name": "start",
          "data": {
            "variables": []
          },
          "class": "flow_node",
          "html": "start",
          "typenode": "vue",
          "inputs": {},
          "outputs": {
            "output_1": {
              "connections": [
                {
                  "node": "2",
                  "output": "input_1"
                }
              ]
            }
          },
          "pos_x": 186,
          "pos_y": 34
        },
        "2": {
          "id": 2,
          "name": "prompt",
          "data": {
            "flow_handle_settings": {
              "on_success": "some",
              "on_failure": 'stop',
              "log_results": false
            },
            "prompt_name": "another_one",
            "prompt_id": 5,
            "variables": [
              {
                "name": "var1",
                "type": "string",
                "value": "val1",
                "prompt_id": 5
              },
              {
                "name": "qaz",
                "type": "string",
                "value": "rfv",
                "prompt_id": 5
              },
              {
                "name": "custom1",
                "type": "string",
                "value": "v1"
              },
              {
                "name": "cus2",
                "type": "string",
                "value": "v2"
              }
            ],
            "prompt_input": "modifyed",
            "integration_uid": "qwe-rty",
            "model_settings": {
              "api_token": {
                "from_secrets": true,
                "value": "{{secret.api_token_default_2}}"
              },
              "model_name": "gpt-35-turbo",
              "api_version": "2023-03-15-preview",
              "api_base": "https://correct.url.com",
              "temperature": 0,
              "max_tokens": 7,
              "top_p": 0.8
            }
          },
          "class": "flow_node",
          "html": "prompt",
          "typenode": "vue",
          "inputs": {
            "input_1": {
              "connections": [
                {
                  "node": "1",
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
          "pos_x": 184,
          "pos_y": 188
        }
      }
    }
  }
}
const export_current = export3

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
          ta_1: JSON.stringify(export_current),
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
        <textarea id="debug1" class="flex-grow-1" v-model="ta_1"></textarea>
        <textarea id="debug2" class="flex-grow-1">{{ e_state }}</textarea>
    </div>
</div>
`
}
