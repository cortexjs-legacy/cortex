npm install 
wget -O gifsicle-1.68.tar.gz http://www.lcdf.org/gifsicle/gifsicle-1.68.tar.gz
tar -zxvf gifsicle-1.68.tar.gz
cd gifsicle-1.68
./configure
make
make install
cd ..
rm -rf gifsicle-1.68.tar.gz gifsicle-1.68
