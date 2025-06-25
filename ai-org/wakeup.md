# President に役割再認識を指示
./agent-send.sh president "あなたはpresidentです。指示書に従って、AI組織を統括してください。cat instructions/president.md"

# Boss1 に役割再認識を指示  
./agent-send.sh boss1 "あなたはboss1です。チームからのステータスを受け取って、チームリーダーとして機能してください。cat instructions/boss.md"

# Worker1 に役割再認識を指示
./agent-send.sh worker1 "あなたはworker1です。現在のステータスをチームに共有して指示書に従って、作業を実行してください。cat instructions/worker.md"

# Worker2 に役割再認識を指示
./agent-send.sh worker2 "あなたはworker2です。現在のステータスをチームに共有して指示書に従って、作業を実行してください。cat instructions/worker.md"

# Worker3 に役割再認識を指示  
./agent-send.sh worker3 "あなたはworker3です。現在のステータスをチームに共有して指示書に従って、作業を実行してください。cat instructions/worker.md"