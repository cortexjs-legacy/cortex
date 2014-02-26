# cortex-profile

<!-- Manage cortex profiles. Profiles are set of frequent configurations which you can switch between. -->

管理 cortex profiles. Profile 是你常用的配置的组合，你可以设置多个 profiles，来达到批量的切换多个配置的目的。类似于 Google chrome 的 user 或者 Firefox 的 profile。

## 概述

```
cortex profile <action> [<name>] [options]
```

## 可用命令

### cortex profile list

列出所有已经存在的 profiles，并且会高亮现实当前所使用的 profile。

```sh
> cortex profile list ↵

* default
  local
```

### cortex profile use {name}

切换当前 profile 为 `name`.

```sh
> cortex profile use local ↵
...
> cortex profile list ↵
  default
* local
```

### cortex profile add {name}

添加一个名为 `name` 的新的 profile。如果该名称的 profile 已经存在，则不会重复添加。

请注意，当你初次安装 cortex 的时候，cortex 会为你自动创建一个名为 `'default'` 的 profile，并设置它为初始的当前 profile。


### cortex profile rm {name} [--remove-data]

移除一个 profile，正式删除前，cortex 会再次确认。

#### `--remove-data` 

- 若包含该参数，则会同时移除该 profile 下的所有数据，包括
    - 模块缓存
    - 已经 build 成功的模块
    - 所包含的配置
    - 以及模块目录下的所有其他目录
- 若不包含该参数，则 cortex 询问是否需要删除数据
- 如果想明确说明保留数据，可以使用 `--no-remove-data`



