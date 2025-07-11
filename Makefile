safety:
	echo "This is a safety check. You must choose a target"

process:
	@echo "Deleting out/"
	rm -rf ./out/ && mkdir -p out/users && mkdir out/content && mkdir out/_links && mkdir -p out/_attach/users && mkdir out/_attach/content
	@echo "Processing XWiki pages..."
	tsx processing/index.ts 2> ./logs/err.out 
	rm -rf out_/ 
	
render: 
	@echo "Rendering XWiki pages..."
	./rendering/acme/gradlew -p ./rendering/acme runMain

full: process render copy

x_old_build:
	rm -rf ./out/ && \
	tsx index.ts 2> ./logs/err.out && \
	rm -rf out_/ && \
	cp -r out/ out_

copy:
	sudo rm -rf ../dokuwiki_data/data/pages/archiv/ && \
	sudo rm -rf ../dokuwiki_data/data/media/archiv/ && \
	sudo mkdir ../dokuwiki_data/data/pages/archiv && \
	sudo cp -r out/users ../dokuwiki_data/data/pages/archiv && \
	sudo cp -r out/content/* ../dokuwiki_data/data/pages/archiv && \
	sudo cp -r out/_attach/ ../dokuwiki_data/data/media/archiv && \
	sudo chown -R 1001 ../dokuwiki_data/data/pages/archiv 