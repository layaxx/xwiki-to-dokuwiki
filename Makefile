safety:
	echo "This is a safety check. You must choose a target"

process:
	@echo "Deleting out/"
	rm -rf ./out/ && mkdir -p out/users && mkdir out/_links && mkdir -p out/_attach/users
	@echo "Processing XWiki pages..."
	tsx processing/index.ts 2> ./logs/err.out 
	rm -rf out_/ 
	


x_old_build:
	rm -rf ./out/ && \
	tsx index.ts 2> ./logs/err.out && \
	rm -rf out_/ && \
	cp -r out/ out_

copy:
	sudo rm -rf ../dokuwiki_data/data/pages/xwiki/ && \
	sudo rm -rf ../dokuwiki_data/data/media/xwiki/ && \
	sudo mkdir ../dokuwiki_data/data/pages/xwiki && \
	sudo cp -r out/* ../dokuwiki_data/data/pages/xwiki && \
	sudo cp -r out/_attach/ ../dokuwiki_data/data/media/xwiki && \
	sudo chown -R 1001 ../dokuwiki_data/data/pages/xwiki 