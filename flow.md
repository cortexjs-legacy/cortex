package:

@param:
    root
    
-> analysis: .git/ .svn/ .prj

-> pull

-> 1. parse all -> md5
    -> map: {path: md5}

-> 2. css bg:  xxx.v123.png -> server/path/xxx.png/<md5>.png

file:
    js: -
    css: -
        文件里面的要替换， image.SERVER 写死
    cssbg: -
 
-> 3. compress

-> 4. compare md5
    
-> write to build/build-<date-time>/
                s/
                    
                
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

1. ftp
2. update data base




db:
url | version

future db:
url | md5