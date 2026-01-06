-- reports 테이블의 관리자 정책을 재생성합니다.
-- 이전에 is_admin 컬럼이 없을 때 정책 생성이 실패했을 수 있습니다.

DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;

CREATE POLICY "reports_admin_all" ON public.reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "reports_insert_authenticated" ON public.reports
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );
