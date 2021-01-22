module.exports = {
	queries: {
		"getUsers": "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = 'public' AND table_name   = 'shows';",
		"getShows": "select [USER] from shows",
		"saveShow": "insert into shows ([USER]) values ([SHOW])",
		"deleteShow": "delete from shows where [USER]='[SHOW]'",
		"deleteUser": "ALTER TABLE shows DROP COLUMN [USER]",
		"addUser": "ALTER TABLE shows ADD [USER] varchar; ALTER TABLE shows ADD UNIQUE ([USER])"
	}
}