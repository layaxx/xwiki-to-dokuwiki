build:
	rm -rf ./out/ && \
	tsx index.ts 2> err.out && \
	rm -rf out_/ && \
	cp -r out/ out_

copy:
	sudo rm -rf ../dokuwiki_data/data/pages/xwiki/ && \
	sudo rm -rf ../dokuwiki_data/data/media/xwiki/ && \
	sudo mkdir ../dokuwiki_data/data/pages/xwiki && \
	sudo cp -r out_/* ../dokuwiki_data/data/pages/xwiki && \
	sudo cp -r out_/attach/ ../dokuwiki_data/data/media/xwiki && \
	sudo chown -R 1001 ../dokuwiki_data/data/pages/xwiki 