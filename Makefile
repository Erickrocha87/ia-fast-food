reset-db:
	@echo "Resetando banco de dados..."
	docker-compose down -v
	docker-compose up -d
	@echo "Aguardando banco inicializar..."
	sleep 5
	npx prisma migrate reset --force
	@echo "Banco de dados resetado e migrações aplicadas!"


up:
	@echo "Subindo containers..."
	docker-compose up -d
	@echo "Containers iniciados!"