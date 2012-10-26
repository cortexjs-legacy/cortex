Kael:
- copy file
- compare md5
- fs more

+1:
- parse css
- md5 all
- compress
- ftp



package:

@param:
    root
    
-> analysis: .git/ .svn/ .prj

-> pull

-> 1. apply project-config.json  -> Kael

-> 1. parse all -> md5          -> +1
    -> map: {path: md5}

-> 2. css bg:  xxx.v123.png -> server/path/xxx.png/<md5>.png   -> +1

file:
    js: -
    css: -
        文件里面的要替换， image.SERVER 写死
    cssbg: -


-> 3. compress              -> +1

-> 4. compare md5           -> Kael
    
-> write to build/
                build-<date-time>/
                    s/
                    
            
                    .cortex/
                        md5.json
                        filelist.txt
    
    

directory structure:

root/
    css/
    js/
    
->

/s/
    j/
        app/
            <name>/
                <js/>
    c/
        app/
            <name>/
                <css/>
                
                
project-config.json






upload:

@param: ip, usr, psw

1. ftp                      -> +1
2. update data base




db:
url | version

future db:
url | md5