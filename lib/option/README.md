# Option configurations

> The developers' draft

The [comfort](https://github.com/kaelzhang/node-comfort) option configurations. 

### exports.options `Object`

An object composed of `<key>: <configuration>`

See npm module, `clean` for details.


## option/install

- **Errors**
  - NS: make No Sense
  - CNS: Can Not Save dependencies
  - NP: No Package file found

- **Normal**
  - CS: Check if install a package into itSelf
  - CV: will Check duplicate Versions
  - NC: No Checking
    - NC(A): install packages Arbitrarily into `neurons`
    - NC(G): install packages Globally
  - R: Read dependencies, check self as a dependency

R read

Save | Global   | Packages | Repo | Type
---- | -------- | -------- | ---- | ----   
0    | 0        | 1        | 1    | CS
1    | 0        | 1        | 1    | CS + CV
-    | -        | -        | -    | -
0    | 0        | 0        | 1    | R
0    | 1        | 0        | 1    | R
1    | 0        | 0        | 1    | R -> ignore save
-    | -        | -        | -    | -
0    | 0        | 1        | 0    | NC(A)
0    | 1        | 1        | 0    | NC(G)
0    | 1        | 1        | 1    | NC(G)
-    | -        | -        | -    | -
0    | 0        | 0        | 0    | NP
0    | 1        | 0        | 0    | NP
-    | -        | -        | -    | -
1    | 0        | 0        | 0    | CNS
1    | 0        | 1        | 0    | CNS
-    | -        | -        | -    | -
1    | 1        | 0        | 0    | NS
1    | 1        | 0        | 1    | NS
1    | 1        | 1        | 0    | NS
1    | 1        | 1        | 1    | NS